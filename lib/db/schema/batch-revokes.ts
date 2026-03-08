import { boolean, char, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const batchRevokes = pgTable('batch_revokes', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  chainId: integer('chain_id').notNull(),
  feeTransactionHash: char('fee_transaction_hash', { length: 66 }),
  feePaid: integer('fee_paid').notNull(),
  isTestnet: boolean('is_testnet').notNull(),
  vatRegion: char('vat_region', { length: 2 }),
  sponsor: text('sponsor'),
  notes: text('notes'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  userAddress: varchar('user_address', { length: 42 }),
});
