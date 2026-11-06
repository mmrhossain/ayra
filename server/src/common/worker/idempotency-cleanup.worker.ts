import { logger } from "../looger/logger.ts";
import { waitWhileBusy } from "../utils/worker.ts";
import { prisma } from "../../lib/prisma.ts";

const LOG_PREFIX = "[idempotency-worker]";
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Deletes idempotency records whose TTL has elapsed. Expired IN_PROGRESS rows
 * are included on purpose: an interrupted request can never be replayed after
 * its window, and the middleware takes over an expired row if a retry arrives
 * before this sweep. Returns the number of removed rows.
 */
export const purgeExpiredIdempotencyKeys = async (): Promise<number> => {
  const { count } = await prisma.idempotencyKey.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
};

let intervalId: NodeJS.Timeout | null = null;
let running = false;
let cycleInFlight = false;

const runCycle = async () => {
  if (cycleInFlight) return;
  cycleInFlight = true;
  try {
    const removed = await purgeExpiredIdempotencyKeys();
    if (removed > 0) {
      logger.info(`${LOG_PREFIX} purged ${removed} expired key(s)`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${LOG_PREFIX} cleanup failed: ${message}`);
  } finally {
    cycleInFlight = false;
  }
};

export const startIdempotencyCleanupWorker = (options?: {
  intervalMs?: number;
}) => {
  if (running) return;
  running = true;

  const intervalMs = options?.intervalMs ?? CLEANUP_INTERVAL_MS;
  void runCycle();
  intervalId = setInterval(() => void runCycle(), intervalMs);
  intervalId.unref?.();
};

export const stopIdempotencyCleanupWorker = async () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
  await waitWhileBusy(() => cycleInFlight);
};
