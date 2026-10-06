import { randomUUID } from "node:crypto";
import { waitWhileBusy } from "../../../common/utils/worker.ts";
import { prisma } from "../../../lib/prisma.ts";
import { resend } from "../../../lib/resend.ts";
import { env } from "../../../config/env.ts";
import { Prisma } from "../../../generated/prisma/client.ts";
import type { QueuedNotification, SendResult } from "../types.ts";

const POLL_INTERVAL_MS = 60_000;
const BATCH_SIZE = 50;
const DB_RETRY_ATTEMPTS = 3;
const DB_RETRY_BASE_MS = 3_000;

let intervalId: NodeJS.Timeout | null = null;
let running = false;
let cycleInFlight = false;
let neonSuspendHintLogged = false;

const TRANSIENT_DB_CODES = new Set([
  "P1001",
  "P1017",
  "P2024",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
]);

const isTransientDbError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const e = error as { code?: string; message?: string };
  const code = String(e.code ?? "");
  if (TRANSIENT_DB_CODES.has(code)) return true;

  const message = (e.message ?? "").toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes("connection terminated") ||
    message.includes("connection reset") ||
    message.includes("server closed the connection") ||
    message.includes("connection timed out") ||
    message.includes("econnreset") ||
    message.includes("econnrefused")
  );
};

const logNeonSuspendHint = (error: unknown) => {
  if (neonSuspendHintLogged || !isTransientDbError(error)) return;
  neonSuspendHintLogged = true;
  console.info(
    "[notification-worker] Neon compute may be auto-suspended (common on free tier). Cold starts can cause P1001 / connection terminated errors. This is not an application bug; paid Neon plans offer an always-on option."
  );
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const withDbRetry = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DB_RETRY_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logNeonSuspendHint(error);

      if (!isTransientDbError(error) || attempt === DB_RETRY_ATTEMPTS) {
        throw error;
      }

      const delayMs = DB_RETRY_BASE_MS * 2 ** (attempt - 1);
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[notification-worker] ${label} failed (attempt ${attempt}/${DB_RETRY_ATTEMPTS}): ${message}; retrying in ${delayMs}ms`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
};

const deliverEmail = async (notification: QueuedNotification): Promise<SendResult> => {
  const from = env.RESEND_FROM ?? env.SMTP_FROM;

  if (!from) {
    throw new Error("No sender address configured (RESEND_FROM/SMTP_FROM)");
  }

  if (!notification.recipient) {
    throw new Error("Missing recipient for email notification");
  }

  const { data, error } = await resend.emails.send({
    from,
    to: notification.recipient,
    subject: notification.subject ?? "Notification",
    html: notification.content.includes("<html")
      ? notification.content
      : `<p>${notification.content}</p>`,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Resend returned no message id");
  }

  return {
    provider: "resend",
    providerMessageId: data.id,
    response: { status: "sent", resendId: data.id, sentAt: new Date().toISOString() },
  };
};

const simulateSend = async (notification: QueuedNotification): Promise<SendResult> => {
  const provider = `simulated-${notification.channel.toLowerCase()}`;
  const providerMessageId = randomUUID();

  return {
    provider,
    providerMessageId,
    response: { status: "sent", simulatedAt: new Date().toISOString() },
  };
};

export const processPendingNotifications = async (): Promise<number> => {
  const candidates = await withDbRetry(
    () =>
      prisma.notification.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: BATCH_SIZE,
        select: { id: true },
      }),
    "find pending notifications"
  );

  if (candidates.length === 0) return 0;

  const ids = candidates.map((candidate) => candidate.id);

  const claimedRows = await withDbRetry(
    () =>
      prisma.$queryRaw<QueuedNotification[]>(Prisma.sql`
        UPDATE "Notification"
        SET status = 'PROCESSING', "updatedAt" = now()
        WHERE id IN (${Prisma.join(ids)})
          AND status = 'PENDING'
        RETURNING id, channel, recipient, subject, content, metadata
      `),
    "claim pending notifications"
  );

  for (const notification of claimedRows) {
    let succeeded = false;
    let delivery: SendResult;

    try {
      delivery =
        notification.channel === "EMAIL"
          ? await deliverEmail(notification)
          : await simulateSend(notification);
      succeeded = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[notification-worker] failed to deliver ${notification.id} (${notification.channel}):`,
        message
      );
      delivery = {
        provider: notification.channel === "EMAIL" ? "resend" : `simulated-${notification.channel.toLowerCase()}`,
        providerMessageId: null,
        response: { status: "failed", error: message, failedAt: new Date().toISOString() },
      };
    }

    try {
      await withDbRetry(async () => {
        await prisma.notificationLog.create({
          data: {
            notificationId: notification.id,
            provider: delivery.provider,
            providerMessageId: delivery.providerMessageId,
            response: delivery.response,
          },
        });

        await prisma.notification.updateMany({
          where: { id: notification.id, status: "PROCESSING" },
          data: succeeded
            ? { status: "SENT", sentAt: new Date() }
            : { status: "FAILED" },
        });
      }, `persist result for ${notification.id}`);
    } catch (error) {
      logNeonSuspendHint(error);
      console.error(
        `[notification-worker] db write failed for ${notification.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return claimedRows.length;
};

export const startNotificationWorker = (options?: { intervalMs?: number }) => {
  if (running) return;
  running = true;

  const intervalMs = options?.intervalMs ?? POLL_INTERVAL_MS;

  const cycle = async () => {
    if (cycleInFlight) return;
    cycleInFlight = true;
    try {
      const processed = await processPendingNotifications();
      if (processed > 0) {
        console.log(
          `[notification-worker] processed ${processed} notification(s)`
        );
      }
    } catch (error) {
      logNeonSuspendHint(error);
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[notification-worker] poll cycle failed after retries; waiting for next cycle:`,
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
    `[notification-worker] started (poll interval ${intervalMs}ms)`
  );
};

export const stopNotificationWorker = async () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
  await waitWhileBusy(() => cycleInFlight);
  console.log("[notification-worker] stopped");
};
