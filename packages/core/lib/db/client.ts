import { neon, Pool } from '@neondatabase/serverless';
import { singleton } from '@revoke.cash/core/utils';
import { drizzle as drizzleHttp, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as autoRevokeSchema from './schema/auto-revoke';
import * as batchRevokesSchema from './schema/batch-revokes';
import * as monitorSchema from './schema/monitor';
import * as premiumSchema from './schema/premium';

const schema = { ...premiumSchema, ...batchRevokesSchema, ...autoRevokeSchema, ...monitorSchema };

const getDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return databaseUrl;
};

const createHttpDb = () => {
  const sql = neon(getDatabaseUrl());
  return drizzleHttp(sql, { schema });
};

const createPoolDb = () => {
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 20 });
  return drizzlePool(pool, { schema });
};

export type DatabaseClient = NeonHttpDatabase<typeof schema>;
export type TransactionalDatabaseClient = NeonDatabase<typeof schema>;
export type DatabaseTransaction = Parameters<Parameters<TransactionalDatabaseClient['transaction']>[0]>[0];
export type DatabaseWriter = DatabaseClient | DatabaseTransaction;

// Long-running services set `NEON_USE_WEBSOCKET=true` to use the pooled WebSocket driver.
// Serverless contexts leave it unset and use the per-request HTTP driver.
// Note: The return type stays `NeonHttpDatabase` so callers don't have to handle a union
// because the methods we use (select/insert/update/delete/query/execute) are structurally identical on both drivers.
export const getDb = singleton((): DatabaseClient => {
  if (process.env.NEON_USE_WEBSOCKET === 'true') {
    return createPoolDb() as unknown as DatabaseClient;
  }
  return createHttpDb();
});

export const getTransactionalDb = singleton(() => createPoolDb());
