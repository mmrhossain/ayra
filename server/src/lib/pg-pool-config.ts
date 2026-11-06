import type { PoolConfig } from "pg";

export type PgPoolConfigInput = {
  connectionString: string;
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
  queryTimeoutMillis: number;
  keepAliveInitialDelayMillis: number;
};

export const buildPgPoolConfig = (input: PgPoolConfigInput): PoolConfig => ({
  connectionString: input.connectionString,
  max: input.max,
  connectionTimeoutMillis: input.connectionTimeoutMillis,
  idleTimeoutMillis: input.idleTimeoutMillis,
  keepAlive: true,
  keepAliveInitialDelayMillis: input.keepAliveInitialDelayMillis,
  query_timeout: input.queryTimeoutMillis,
});
