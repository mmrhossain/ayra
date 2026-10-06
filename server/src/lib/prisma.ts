import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";
import type { Prisma } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";

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

const adapter = new PrismaPg({
  connectionString,
  max: poolMax,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 20_000,
  keepAlive: true,
});

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
    maxWait: env.NODE_ENV === "test" ? 20_000 : 2_000,
    timeout: options?.timeout ?? (env.NODE_ENV === "test" ? 30_000 : 10_000),
    ...options,
  });
};
