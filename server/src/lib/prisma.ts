import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";
import type { Prisma } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { logger } from "../common/looger/logger";
import { buildPgPoolConfig } from "./pg-pool-config";

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const looksPooled =
  /[-.]pooler[.-]/i.test(connectionString) || /(?:[?&])pgbouncer=true/i.test(connectionString);

if (!looksPooled) {
  console.info(
    "[prisma] DATABASE_URL does not look like a Neon pooled/pgbouncer endpoint. Use the pooler connection string for workers/backends to reduce connection pressure."
  );
}

const poolMax =
  env.NODE_ENV === "test" ? Math.min(env.DATABASE_POOL_MAX, 5) : env.DATABASE_POOL_MAX;

const adapter = new PrismaPg(
  buildPgPoolConfig({
    connectionString,
    max: poolMax,
    connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT_MS,
    queryTimeoutMillis: env.DATABASE_QUERY_TIMEOUT_MS,
    keepAliveInitialDelayMillis: env.DATABASE_KEEPALIVE_INITIAL_DELAY_MS,
  }),
  {
    onPoolError: (error) => {
      logger.error({
        message: "[prisma] Pool error; dead connections will be discarded and re-established",
        error: error.message,
      });
    },
    onConnectionError: (error) => {
      logger.error({
        message: "[prisma] Connection error; connection will be recycled",
        error: error.message,
      });
    },
  }
);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type TransactionClient = Prisma.TransactionClient;

export const transaction = <T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options?: {
    isolationLevel?: Prisma.TransactionIsolationLevel;
    timeout?: number;
  }
): Promise<T> => {
  return prisma.$transaction(fn, {
    maxWait:
      env.NODE_ENV === "test" ? 20_000 : env.DATABASE_TRANSACTION_MAX_WAIT_MS,
    timeout:
      options?.timeout ??
      (env.NODE_ENV === "test" ? 30_000 : env.DATABASE_TRANSACTION_TIMEOUT_MS),
    ...options,
  });
};
