import { logger } from "../../../common/looger/logger.ts";
import { waitWhileBusy } from "../../../common/utils/worker.ts";
import { MEDIA_WORKER_INTERVAL_MS } from "../media.constants.ts";
import { purgeExpiredMediaAssets } from "../media.service.ts";

const LOG_PREFIX = "[media-worker]";

type MediaJob = {
  name: string;
  run: () => Promise<number | void>;
};

const jobs: MediaJob[] = [
  {
    name: "purge-expired-assets",
    run: purgeExpiredMediaAssets,
  },
];

let intervalId: NodeJS.Timeout | null = null;
let running = false;
let cycleInFlight = false;

const runCycle = async () => {
  if (cycleInFlight) return;
  cycleInFlight = true;
  try {
    for (const job of jobs) {
      try {
        const result = await job.run();
        if (typeof result === "number" && result > 0) {
          logger.info(`${LOG_PREFIX} ${job.name} completed (${result})`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`${LOG_PREFIX} ${job.name} failed: ${message}`);
      }
    }
  } finally {
    cycleInFlight = false;
  }
};

export const startMediaWorker = (intervalMs = MEDIA_WORKER_INTERVAL_MS) => {
  if (running) return;
  running = true;

  void runCycle();
  intervalId = setInterval(() => void runCycle(), intervalMs);
  intervalId.unref?.();
};

export const stopMediaWorker = async () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
  await waitWhileBusy(() => cycleInFlight);
};
