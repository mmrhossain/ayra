import { prisma, transaction } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { env } from "../../../config/env.ts";
import { logger } from "../../../common/looger/logger.ts";
import { quoteShipping } from "../../shipping/services/shipping.service.ts";
import { applyCouponAtomic } from "../../coupon/coupon.service.ts";
import {
  enqueueOrderConfirmation,
  notifyNewOrder,
} from "../../notification/services/notification.service.ts";import {
  buildOrderItemsTable,
  buildOrderSummaryTable,
  escapeHtml,
  type EmailSummaryRow,
} from "../../../template/email.ts";
import type { CheckoutInput } from "../../cart/types.ts";
import {
  allocateLineMoney,
  computeCheckoutTotals,
  formatVariantName,
  fromMinor,
  generateOrderNumber,
  isOrderNumberConflict,
  omitOrderCostPrice,
  ORDER_NUMBER_ATTEMPTS,
  saveCheckoutAddressIfNew,
  toMinor,
  toOrderAddress,
} from "../utils/order-helpers.ts";
import { assertCheckoutItemsAvailable } from "../utils/order-validation.ts";
import { getSettingValue } from "../../settings/settings.service.ts";
import { reserveCheckoutStock } from "./order-stock.service.ts";
import { dispatchLowStockAlerts } from "../../catalog/inventory/services/inventory.service.ts";
import { assertAddressGeoHierarchy } from "../../geography/utils/address-geo.ts";

// Kept below the client's 35s checkout budget so the browser never aborts a
// transaction that is still running on the server.
const CHECKOUT_TRANSACTION_TIMEOUT_MS = 20_000;

export const checkout = async (
    customerProfileId: string,
    input: CheckoutInput
) => {
  const [pricesIncludeTax, taxRatePercent, enabledMethods] = await Promise.all([
    getSettingValue<boolean>("checkout.pricesIncludeTax"),
    getSettingValue<number>("checkout.taxRatePercent"),
    getSettingValue<string[]>("payment.enabledMethods"),
  ]);

  if (!enabledMethods.includes(input.paymentMethod)) {
    throw new AppError("This payment method is currently unavailable", 400);
  }

  await assertAddressGeoHierarchy(input.billingAddress);
  if (input.shippingAddress) {
    await assertAddressGeoHierarchy(input.shippingAddress);
  }

  const runCheckout = (orderNumber: string) => transaction(async (tx) => {
    const cartRows = await tx.$queryRaw<
        Array<{ id: string }>
    >`SELECT id FROM "cart" WHERE id IN (SELECT id FROM "cart" WHERE "customerProfileId" = ${customerProfileId} AND status = 'ACTIVE' ORDER BY "createdAt" ASC LIMIT 1) FOR UPDATE`;

    if (!cartRows[0]) throw new AppError("Cart is empty", 400);

    const cart = await tx.cart.findUniqueOrThrow({
      where: { id: cartRows[0].id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    status: true,
                    deletedAt: true,
                    categoryId: true,
                  },
                },
                attributes: { include: { attributeValue: true } },
              },
            },
          },
        },
        coupon: true,
        customerProfile: {
          select: {
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (cart.items.length === 0) throw new AppError("Cart is empty", 400);

    assertCheckoutItemsAvailable(cart.items);

    const subtotalMinor = cart.items.reduce(
        (sum, item) => sum + toMinor(item.variant!.price) * item.quantity,
        0
    );
    const subtotal = fromMinor(subtotalMinor);

    if (
      !input.acceptPriceChange &&
      input.expectedSubtotal !== undefined &&
      toMinor(input.expectedSubtotal) !== subtotalMinor
    ) {
      throw new AppError(
        "Some item prices changed. Please review your order before confirming.",
        409,
        "CART_PRICE_CHANGED",
        {
          expectedSubtotal: fromMinor(toMinor(input.expectedSubtotal)),
          currentSubtotal: subtotal,
          items: cart.items.map((item) => ({
            variantId: item.variantId,
            sku: item.sku,
            productName: item.variant!.product.name,
            quantity: item.quantity,
            currentUnitPrice: fromMinor(toMinor(item.variant!.price)),
            currentLineSubtotal: fromMinor(
              toMinor(item.variant!.price) * item.quantity,
            ),
          })),
        },
      );
    }

    const productIds = cart.items.map((i) => i.productId);
    const productCategoryIds = cart.items.map((item) => item.variant!.product.categoryId);
    const couponLines = cart.items.map((item) => ({
      productId: item.productId,
      categoryId: item.variant!.product.categoryId,
      subtotal: fromMinor(toMinor(item.variant!.price) * item.quantity),
    }));

    let discountAmount = 0;
    let coupon: { id: string; discountType: string } | null = null;
    const couponCode = input.couponCode ?? cart.coupon?.couponCode;

    if (couponCode) {
      const res = await applyCouponAtomic(
          couponCode,
          customerProfileId,
          { subtotal, productIds, productCategoryIds, lines: couponLines },
          tx
      );
      discountAmount = res.discountAmount;
      coupon = res.coupon;
    }

    const deliveryAddress = input.shippingAddress ?? input.billingAddress;
    const shippingQuote = await quoteShipping(
      deliveryAddress,
      input.shippingMethodCode,
      fromMinor(Math.max(0, toMinor(subtotal) - toMinor(discountAmount))),
      tx
    );
    const { taxAmount, shippingAmount, grandTotal } = computeCheckoutTotals(
      subtotal,
      discountAmount,
      coupon,
      shippingQuote.shippingAmount,
      { pricesIncludeTax, taxRatePercent },
    );
    const lineAllocations = allocateLineMoney(
      cart.items.map((item) => ({
        unitPrice: item.variant!.price,
        quantity: item.quantity,
      })),
      discountAmount,
      { pricesIncludeTax, taxRatePercent },
    );

    const {
      reservations,
      inventoryTransactionsData,
      lowStockAlerts,
    } = await reserveCheckoutStock(
      tx,
      cart.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
        variantId: item.variantId,
      })),
      orderNumber,
      customerProfileId,
    );

    await tx.inventoryTransaction.createMany({
      data: inventoryTransactionsData,
    });

    const order = await tx.order.create({
      data: {
        orderNumber,
        subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        pricesIncludeTax,
        taxRatePercent,
        shippingMethodName: shippingQuote.methodName,
        shippingMethodCode: shippingQuote.methodCode,
        shippingZoneId: shippingQuote.zoneId,
        shippingZoneName: shippingQuote.zoneName,
        shippingZoneCode: shippingQuote.zoneCode,
        shippingRateId: shippingQuote.rateId,
        shippingRatePrice: shippingQuote.price,
        grandTotal,
        notes: input.notes ?? null,
        customerProfileId,
        items: {
          create: cart.items.map((item, index) => ({
            productName: item.variant!.product.name,
            sku: item.variant!.sku,
            variantName: formatVariantName(item.variant!),
            quantity: item.quantity,
            unitPrice: fromMinor(toMinor(item.variant!.price)),
            costPrice: item.variant!.costPrice,
            costSource:
              item.variant!.costPrice === null ||
              item.variant!.costPrice === undefined
                ? null
                : "VARIANT_AT_CHECKOUT",
            costCapturedAt: new Date(),
            discountAmount: fromMinor(
              lineAllocations[index]?.discountMinor ?? 0,
            ),
            taxAmount: fromMinor(lineAllocations[index]?.taxMinor ?? 0),
            allocationVersion: 1,
            subtotal: fromMinor(lineAllocations[index]?.grossMinor ?? 0),
            variantId: item.variantId,
          })),
        },
        addresses: {
          create: [
            toOrderAddress(input.billingAddress, "BILLING"),
            toOrderAddress(input.shippingAddress ?? input.billingAddress, "SHIPPING"),
          ],
        },
        statusHistory: {
          create: { status: "PENDING", remarks: "Order created" },
        },
        events: {
          create: { eventType: "ORDER_CREATED", metadata: { orderNumber } },
        },
        payments: {
          create: {
            method: input.paymentMethod,
            status: "PENDING",
            amount: grandTotal,
          },
        },
        ...(coupon
          ? {
              couponUsages: {
                create: {
                  couponId: coupon.id,
                  customerProfileId,
                  discountAmount,
                },
              },
            }
          : {}),
      },
      include: { items: true, payments: true, addresses: true },
    });

    await tx.stockReservation.createMany({
      data: reservations.map(r => ({
        variantId: r.variantId,
        quantity: r.quantity,
        orderId: order.id,
        warehouseId: r.warehouseId,
        expiresAt: r.expiresAt,
      })),
      skipDuplicates: true,
    });
    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }
    await tx.cart.update({
      where: { id: cart.id },
      data: {
        status: "CHECKED_OUT",
        activities: {
          create: {
            eventType: "CHECKOUT_STARTED",
            metadata: { orderId: order.id, orderNumber },
          },
        },
      },
    });

    return {
      order: omitOrderCostPrice(order),
      profile: cart.customerProfile,
      deliveryAddress,
      lowStockAlerts,
    };
  }, {
    timeout: CHECKOUT_TRANSACTION_TIMEOUT_MS
  });

  for (let attempt = 1; attempt <= ORDER_NUMBER_ATTEMPTS; attempt++) {
    try {
      const { order, profile, deliveryAddress, lowStockAlerts } = await runCheckout(
        generateOrderNumber(),
      );

      // Stock changes are committed at this point, so alerting admins here can
      // never roll back a paid order.
      await dispatchLowStockAlerts(lowStockAlerts);

      // The address book is a convenience side effect. Persist it after the
      // order commits so a failure here can never roll back a paid order and
      // the checkout transaction stays short.
      try {
        await saveCheckoutAddressIfNew(
          prisma,
          customerProfileId,
          deliveryAddress,
        );
      } catch (error) {
        logger.error({
          message: "Failed to save checkout address",
          customerProfileId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (profile) {
        const currency = order.currency;
        const itemsTable = buildOrderItemsTable(
          order.items.map((item) => ({
            name: item.productName,
            variant: item.variantName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice).toFixed(2),
            subtotal: Number(item.subtotal).toFixed(2),
          })),
          currency,
        );
        const summaryRows: EmailSummaryRow[] = [
          {
            label: "Subtotal",
            value: `${currency} ${Number(order.subtotal).toFixed(2)}`,
          },
          ...(Number(order.discountAmount) > 0
            ? [
                {
                  label: "Discount",
                  value: `- ${currency} ${Number(order.discountAmount).toFixed(2)}`,
                },
              ]
            : []),
          {
            label: "Shipping",
            value: `${currency} ${Number(order.shippingAmount).toFixed(2)}`,
          },
          ...(Number(order.taxAmount) > 0
            ? [
                {
                  label: "Tax",
                  value: `${currency} ${Number(order.taxAmount).toFixed(2)}`,
                },
              ]
            : []),
          {
            label: "Total",
            value: `${currency} ${Number(order.grandTotal).toFixed(2)}`,
            emphasis: true,
          },
        ];
        const summaryTable = buildOrderSummaryTable(summaryRows);
        const orderUrl = `${env.FRONTEND_URL.replace(/\/+$/, "")}/customer/orders/view-order/${encodeURIComponent(order.id)}`;

        await enqueueOrderConfirmation(profile.userId, {
          customerName: escapeHtml(profile.user.name),
          orderNumber: order.orderNumber,
          itemsTable,
          summaryTable,
          orderUrl,
        });

        await notifyNewOrder({
          orderNumber: order.orderNumber,
          customerName: profile.user.name,
          customerEmail: profile.user.email,
          currency,
          grandTotal: Number(order.grandTotal).toFixed(2),
          itemsTable,
          summaryTable,
          orderUrl: `${env.FRONTEND_URL.replace(/\/+$/, "")}/admin/orders`,
        });
      }
      return order;
    } catch (err) {
      const lastAttempt = attempt === ORDER_NUMBER_ATTEMPTS;
      if (!isOrderNumberConflict(err) || lastAttempt) throw err;
    }
  }

  throw new AppError("Unable to allocate a unique order number", 500);
};
