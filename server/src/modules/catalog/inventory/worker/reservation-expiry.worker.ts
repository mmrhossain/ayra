import { waitWhileBusy } from "../../../../common/utils/worker.ts";
import { Prisma } from "../../../../generated/prisma/client.ts";
import { prisma, transaction, type TransactionClient } from "../../../../lib/prisma.ts";
import { reverseCouponUsage } from "../../../coupon/coupon.service.ts";
import {
  applyInventoryReleases,
  lockInventoryForVariants,
} from "../services/inventory.service.ts";

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const BATCH_SIZE = 100;

let intervalId: NodeJS.Timeout | null = null;
let running = false;
let cycleInFlight = false;

type ReservationRow = {
  id: string;
  variantId: string;
  warehouseId: string;
  quantity: number;
};

const releaseReservationRows = async (
  tx: TransactionClient,
  reservations: ReservationRow[],
  remarks: string,
  requireExpired = true,
) => {
  if (reservations.length === 0) return 0;

  const sorted = [...reservations].sort((a, b) =>
    a.warehouseId === b.warehouseId
      ? a.variantId.localeCompare(b.variantId)
      : a.warehouseId.localeCompare(b.warehouseId),
  );
  const warehouseIds = [...new Set(sorted.map((row) => row.warehouseId))].sort((a, b) =>
    a.localeCompare(b),
  );
  const inventoryByKey = new Map<string, { id: string }>();
  for (const warehouseId of warehouseIds) {
    const variantIds = sorted
      .filter((row) => row.warehouseId === warehouseId)
      .map((row) => row.variantId);
    const lockedRows = await lockInventoryForVariants(tx, warehouseId, variantIds);
    for (const row of lockedRows) {
      inventoryByKey.set(`${row.warehouseId}:${row.variantId}`, row);
    }
  }

  const reservationIds = sorted.map((row) => row.id);
  const deletedRows = requireExpired
    ? await tx.$queryRaw<Array<{ id: string }>>`
        DELETE FROM "StockReservation"
        WHERE id IN (${Prisma.join(reservationIds)})
          AND "expiresAt" < now()
        RETURNING id
      `
    : await tx.$queryRaw<Array<{ id: string }>>`
        DELETE FROM "StockReservation"
        WHERE id IN (${Prisma.join(reservationIds)})
        RETURNING id
      `;
  const deletedIds = new Set(deletedRows.map((row) => row.id));

  const releaseUpdates: Array<{ id: string; quantity: number }> = [];
  const transactions: Array<{
    inventoryId: string;
    variantId: string;
    warehouseId: string;
    type: "RELEASE";
    quantity: number;
    referenceType: string;
    referenceId: string;
    remarks: string;
  }> = [];

  for (const reservation of sorted) {
    if (!deletedIds.has(reservation.id)) continue;
    const invRow = inventoryByKey.get(`${reservation.warehouseId}:${reservation.variantId}`);
    if (!invRow) continue;

    releaseUpdates.push({ id: invRow.id, quantity: reservation.quantity });
    transactions.push({
      inventoryId: invRow.id,
      variantId: reservation.variantId,
      warehouseId: reservation.warehouseId,
      type: "RELEASE",
      quantity: reservation.quantity,
      referenceType: "STOCK_RESERVATION",
      referenceId: reservation.id,
      remarks,
    });
  }

  await applyInventoryReleases(tx, releaseUpdates);
  if (transactions.length > 0) {
    await tx.inventoryTransaction.createMany({ data: transactions });
  }
  return deletedIds.size;
};

/**
 * Release stock held by reservations whose TTL has elapsed.
 *
 * Unpaid PENDING orders are cancelled in the same transaction as the stock
 * release so a late IPN cannot mark them paid after inventory is gone.
 * Already-PAID orders keep their reservations until payment commit consumes
 * them; those rows are skipped.
 */
export const releaseExpiredReservations = async (): Promise<number> => {
  const expired = await prisma.stockReservation.findMany({
    where: { expiresAt: { lt: new Date() } },
    orderBy: { expiresAt: "asc" },
    take: BATCH_SIZE,
  });

  const byOrder = new Map<string, typeof expired>();
  for (const reservation of expired) {
    const group = byOrder.get(reservation.orderId) ?? [];
    group.push(reservation);
    byOrder.set(reservation.orderId, group);
  }

  let released = 0;

  for (const [orderId, reservations] of byOrder) {
    try {
      const didRelease = await transaction(async (tx) => {
        const lockedOrders = await tx.$queryRaw<
          Array<{
            id: string;
            status: string;
            paymentStatus: string;
            deletedAt: Date | null;
          }>
        >`SELECT id, status, "paymentStatus", "deletedAt" FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
        const order = lockedOrders[0];

        if (
          order &&
          (order.paymentStatus === "PAID" ||
            order.paymentStatus === "PARTIALLY_PAID" ||
            order.status === "CONFIRMED")
        ) {
          return 0;
        }

        const toRelease =
          order && order.status === "PENDING" && !order.deletedAt
            ? await tx.stockReservation.findMany({ where: { orderId } })
            : reservations;

        const count = await releaseReservationRows(
          tx,
          toRelease,
          "Reservation expired; stock returned to available",
          !(order && order.status === "PENDING" && !order.deletedAt),
        );

        if (order && order.status === "PENDING" && !order.deletedAt && count > 0) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED", paymentStatus: "FAILED" },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: "CANCELLED",
              remarks: "Reservation expired; unpaid order cancelled",
              changedBy: "system:reservation-expiry",
            },
          });

          await tx.orderEvent.create({
            data: {
              orderId: order.id,
              eventType: "ORDER_CANCELLED",
              metadata: { reason: "reservation-expired" },
            },
          });

          await tx.payment.updateMany({
            where: {
              orderId: order.id,
              status: { in: ["INITIATED", "PENDING"] },
              deletedAt: null,
            },
            data: { status: "FAILED" },
          });

          await reverseCouponUsage(tx, order.id);
        }

        return count;
      });

      released += didRelease;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[reservation-expiry-worker] failed for order ${orderId}:`,
        message
      );
    }
  }

  return released;
};

export const startReservationExpiryWorker = (options?: {
  intervalMs?: number;
}) => {
  if (running) return;
  running = true;

  const intervalMs = options?.intervalMs ?? POLL_INTERVAL_MS;

  const cycle = async () => {
    if (cycleInFlight) return;
    cycleInFlight = true;
    try {
      const released = await releaseExpiredReservations();
      if (released > 0) {
        console.log(
          `[reservation-expiry-worker] released ${released} expired reservation(s)`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[reservation-expiry-worker] poll cycle failed; waiting for next cycle:`,
        message
      );
    } finally {
      cycleInFlight = false;
    }
  };

  void cycle();
  intervalId = setInterval(() => void cycle(), intervalMs);
  intervalId.unref?.();

  console.log(
    `[reservation-expiry-worker] started (poll interval ${intervalMs}ms)`
  );
};

export const stopReservationExpiryWorker = async () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
  await waitWhileBusy(() => cycleInFlight);
  console.log("[reservation-expiry-worker] stopped");
};
