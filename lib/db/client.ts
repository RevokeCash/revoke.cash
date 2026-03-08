import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import { singleton } from 'lib/utils';
import * as batchRevokesSchema from './schema/batch-revokes';
import * as premiumSchema from './schema/premium';

const schema = { ...premiumSchema, ...batchRevokesSchema };

const getDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return databaseUrl;
};

/** HTTP-based client — lightweight, no persistent connections, ideal for simple queries in serverless/edge. */
const createDb = () => {
  const sql = neon(getDatabaseUrl());
  return drizzleHttp(sql, { schema });
};

/** WebSocket Pool-based client — supports transactions, use only where `.transaction()` is needed. */
const createTransactionalDb = () => {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  return drizzlePool(pool, { schema });
};

export type DatabaseClient = ReturnType<typeof createDb>;
export type TransactionalDatabaseClient = ReturnType<typeof createTransactionalDb>;
export type DatabaseTransaction = Parameters<Parameters<TransactionalDatabaseClient['transaction']>[0]>[0];

export const getDb = singleton(() => createDb());
export const getTransactionalDb = singleton(() => createTransactionalDb());
