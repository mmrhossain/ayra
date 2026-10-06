import app from "./app.ts";
import { env } from "./config/env.ts";
import { assertCloudinaryConfigured } from "./lib/cloudinary.ts";
import { prisma } from "./lib/prisma.ts";
import { redis } from "./lib/redis.ts";
import {
  startReservationExpiryWorker,
  stopReservationExpiryWorker,
} from "./modules/catalog/inventory/worker/reservation-expiry.worker.ts";
import { startMediaWorker, stopMediaWorker } from "./modules/media/worker/media.worker.ts";
import {
  startNotificationWorker,
  stopNotificationWorker,
} from "./modules/notification/worker/notification.worker.ts";

assertCloudinaryConfigured();

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

// Function to warm up Neon and start workers safely
async function initializeApp() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`Waking up database (attempt ${attempt}/${maxRetries})...`);
      // Force a lightweight query to wake up Neon's serverless compute
      await prisma.$executeRawUnsafe(`SELECT 1`);
      console.log("Database is awake and connected!");
      break;
    } catch (error) {
      console.warn(`Database wake-up failed (attempt ${attempt}):`, error);
      if (attempt >= maxRetries) {
        console.error(
          "Could not wake up database on startup. Starting workers anyway, they will retry..."
        );
      } else {
        // Wait 3 seconds before retrying the wake-up
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  // Now safely start background workers after the wake-up attempt
  startNotificationWorker();
  startReservationExpiryWorker();
  startMediaWorker();
}

initializeApp();

const FORCE_EXIT_MS = 10_000;
let shuttingDown = false;

const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received`);

  const forceTimer = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, FORCE_EXIT_MS);
  forceTimer.unref?.();

  const workersDrained = Promise.all([
    stopNotificationWorker(),
    stopReservationExpiryWorker(),
    stopMediaWorker(),
  ]).catch((err) => {
    console.error("Worker drain failed", err);
  });

  server.close(async () => {
    await workersDrained;

    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error("Prisma disconnect failed", err);
    }

    try {
      if (redis) await redis.quit();
    } catch (err) {
      console.error("Redis quit failed", err);
    }

    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
