import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  numeric,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Address, Hash, Hex } from 'viem';
import { AllowanceType } from '../../allowances';

export const monitorSchema = pgSchema('monitor');

export const monitorApprovalTypeEnum = monitorSchema.enum(
  'approval_type',
  Object.values(AllowanceType) as [AllowanceType, ...AllowanceType[]],
);

export const monitorScanState = monitorSchema.table(
  'scan_state',
  {
    address: text('address').notNull().$type<Address>(),
    chainId: integer('chain_id').notNull(),
    lastScanAt: timestamp('last_scan_at', { withTimezone: true }),
    lastToBlock: bigint('last_to_block', { mode: 'number' }),
    maxBlockRange: bigint('max_block_range', { mode: 'number' }),
    lastEventAt: timestamp('last_event_at', { withTimezone: true }),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull().defaultNow(),
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
    lastError: text('last_error'),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ name: 'scan_state_pkey', columns: [table.address, table.chainId] }),
    index('idx_scan_state_next_run').on(table.nextRunAt).where(sql`${table.disabledAt} IS NULL`),
  ],
);

export const monitorBlockTimestamps = monitorSchema.table(
  'block_timestamps',
  {
    chainId: integer('chain_id').notNull(),
    blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
    timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  },
  (table) => [primaryKey({ name: 'block_timestamps_pkey', columns: [table.chainId, table.blockNumber] })],
);

// Note that this table is partitioned by chain_id (LIST). Child partitions are created via a raw-SQL block in the
// migration, one per chain in ORDERED_CHAINS. Adding a new chain requires a one-line
// migration to create a new partition.
//
// Primary key includes chain_id because Postgres requires the partition key to be part of
// every unique constraint on a partitioned table.
export const monitorEventsCache = monitorSchema.table(
  'events_cache',
  {
    chainId: integer('chain_id').notNull(),
    address: text('address').notNull().$type<Address>(),
    transactionHash: text('transaction_hash').notNull().$type<Hash>(),
    transactionIndex: integer('transaction_index').notNull(),
    logIndex: integer('log_index').notNull(),
    blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
    topic0: text('topic0').notNull().$type<Hex>(),
    topic1: text('topic1').$type<Hex>(),
    topic2: text('topic2').$type<Hex>(),
    topic3: text('topic3').$type<Hex>(),
    data: text('data').notNull().$type<Hex>(),
    timestamp: bigint('timestamp', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reorged: boolean('reorged').notNull().default(false),
  },
  (table) => [
    primaryKey({
      name: 'events_cache_pkey',
      columns: [table.chainId, table.transactionHash, table.logIndex],
    }),
    index('idx_events_cache_topic0').on(table.chainId, table.topic0),
    index('idx_events_cache_topic1').on(table.chainId, table.topic1).where(sql`${table.topic1} IS NOT NULL`),
    index('idx_events_cache_topic2').on(table.chainId, table.topic2).where(sql`${table.topic2} IS NOT NULL`),
    index('idx_events_cache_topic3').on(table.chainId, table.topic3).where(sql`${table.topic3} IS NOT NULL`),
    index('idx_events_cache_unresolved_timestamps')
      .on(table.chainId, table.blockNumber)
      .where(sql`${table.timestamp} IS NULL`),
  ],
);

export const monitorAllowanceState = monitorSchema.table(
  'allowance_state',
  {
    address: text('address').notNull().$type<Address>(),
    chainId: integer('chain_id').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true }),
    computedToBlock: bigint('computed_to_block', { mode: 'number' }),
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
    lastError: text('last_error'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ name: 'allowance_state_pkey', columns: [table.address, table.chainId] })],
);

export const monitorAllowances = monitorSchema.table(
  'allowances',
  {
    id: uuid('id').notNull().defaultRandom(),
    chainId: integer('chain_id').notNull(),
    address: text('address').notNull().$type<Address>(),
    tokenAddress: text('token_address').notNull().$type<Address>(),
    spenderAddress: text('spender_address').notNull().$type<Address>(),
    approvalType: monitorApprovalTypeEnum('approval_type').notNull(),
    // Type-specific fields. Nullable because each row uses a subset depending on approval_type.
    amount: numeric('amount', { mode: 'bigint' }), // erc20, permit2
    tokenId: numeric('token_id', { mode: 'bigint' }), // erc721_single
    approved: boolean('approved'), // erc721_all
    permit2Address: text('permit2_address').$type<Address>(), // permit2 (which Permit2 instance)
    expiration: bigint('expiration', { mode: 'number' }), // permit2 (unix seconds)
    // `lastUpdated` mirrors the existing `BaseAllowance.lastUpdated` shape (block + tx + timestamp)
    lastUpdatedBlock: bigint('last_updated_block', { mode: 'number' }).notNull(),
    lastUpdatedTxHash: text('last_updated_tx_hash').notNull().$type<Hash>(),
    lastUpdatedTimestamp: bigint('last_updated_timestamp', { mode: 'number' }).notNull(),
  },
  (table) => [
    primaryKey({ name: 'allowances_pkey', columns: [table.id] }),
    index('idx_allowances_address').on(table.address, table.chainId),
    index('idx_allowances_spender').on(table.spenderAddress, table.chainId),
    index('idx_allowances_token').on(table.tokenAddress, table.chainId),
  ],
);
