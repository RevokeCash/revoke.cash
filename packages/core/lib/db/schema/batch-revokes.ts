import { sql } from 'drizzle-orm';
import { boolean, char, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
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
    feeVerifiedAt: timestamp('fee_verified_at', { withTimezone: true }),
    feeVerificationError: text('fee_verification_error'),
  },
  (table) => [
    index('idx_batch_revokes_timestamp').on(table.timestamp),
    uniqueIndex('idx_batch_revokes_chain_fee_transaction_hash_unique')
      .on(table.chainId, table.feeTransactionHash)
      .where(sql`${table.feeTransactionHash} IS NOT NULL`),
  ],
);
