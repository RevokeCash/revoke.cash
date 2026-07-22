import { boolean, char, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { lowercaseAddress } from '../types/lowercase-address';

export const batchRevokes = pgTable(
  'batch_revokes',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    chainId: integer('chain_id').notNull(),
    feeTransactionHash: char('fee_transaction_hash', { length: 66 }),
    feeUsdCents: integer('fee_usd_cents').notNull(),
    isTestnet: boolean('is_testnet').notNull(),
    vatRegion: char('vat_region', { length: 2 }),
    sponsor: text('sponsor'),
    notes: text('notes'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    userAddress: lowercaseAddress('user_address'),
  },
  (table) => [index('idx_batch_revokes_timestamp').on(table.timestamp)],
);
