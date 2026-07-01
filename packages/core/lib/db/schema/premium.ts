import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  foreignKey,
  index,
  integer,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Hash } from 'viem';
import { lowercaseAddress } from '../types/lowercase-address';

export const premiumSchema = pgSchema('premium');

export const premiumPaymentStatusEnum = premiumSchema.enum('payment_status', [
  'pending',
  'confirmed',
  'expired',
  'failed',
]);
export const premiumPlanTierEnum = premiumSchema.enum('plan_tier', ['premium', 'ultimate']);

export const premiumPlans = premiumSchema.table(
  'plans',
  {
    id: text('id').notNull(),
    version: integer('version').notNull(),
    name: text('name').notNull(),
    priceUsd: integer('price_usd').notNull(),
    durationDays: integer('duration_days').notNull(),
    maxAddresses: integer('max_addresses').notNull(),
    tier: premiumPlanTierEnum('tier').notNull().default('premium'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ name: 'plans_pkey', columns: [table.id, table.version] }),
    index('idx_plans_active').on(table.isActive),
    uniqueIndex('idx_plans_active_by_id_unique').on(table.id).where(sql`${table.isActive} IS TRUE`),
  ],
);

export const premiumPayments = premiumSchema.table(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: text('plan_id').notNull(),
    planVersion: integer('plan_version').notNull(),
    ownerAddress: lowercaseAddress('owner_address').notNull(),
    subscriptionId: uuid('subscription_id').references(() => premiumSubscriptions.id),
    chainId: integer('chain_id').notNull(),
    tokenAddress: lowercaseAddress('token_address').notNull(),
    tokenSymbol: text('token_symbol').notNull(),
    tokenDecimals: integer('token_decimals').notNull(),
    amountUsd: integer('amount_usd').notNull(),
    status: premiumPaymentStatusEnum('status').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    scanFromBlock: bigint('scan_from_block', { mode: 'bigint' }).notNull(),
    matchedTxHash: text('matched_tx_hash').$type<Hash>(),
    vatRegion: char('vat_region', { length: 2 }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.planVersion],
      foreignColumns: [premiumPlans.id, premiumPlans.version],
      name: 'payments_plan_fk',
    }),
    index('idx_payments_owner').on(table.ownerAddress),
    index('idx_payments_status').on(table.status),
    index('idx_payments_chain_scan_start').on(table.chainId, table.scanFromBlock),
    index('idx_payments_subscription').on(table.subscriptionId),
    uniqueIndex('idx_payments_matched_tx_hash_unique')
      .on(table.matchedTxHash)
      .where(sql`${table.matchedTxHash} IS NOT NULL`),
    index('idx_payments_confirmed_at').on(table.confirmedAt),
  ],
);

export const premiumSubscriptions = premiumSchema.table(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: text('plan_id').notNull(),
    planVersion: integer('plan_version').notNull(),
    ownerAddress: lowercaseAddress('owner_address').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.planVersion],
      foreignColumns: [premiumPlans.id, premiumPlans.version],
      name: 'subscriptions_plan_fk',
    }),
    index('idx_subscriptions_owner').on(table.ownerAddress),
    index('idx_subscriptions_ends').on(table.endsAt),
  ],
);

export const premiumSubscriptionAddresses = premiumSchema.table(
  'subscription_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => premiumSubscriptions.id),
    address: lowercaseAddress('address').notNull(),
    addedBy: lowercaseAddress('added_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('subscription_addresses_subscription_address_unique').on(table.subscriptionId, table.address),
    index('idx_subscription_addresses_address').on(table.address),
  ],
);

export const premiumPlansRelations = relations(premiumPlans, ({ many }) => ({
  subscriptions: many(premiumSubscriptions),
  payments: many(premiumPayments),
}));

export const premiumPaymentsRelations = relations(premiumPayments, ({ one }) => ({
  plan: one(premiumPlans, {
    fields: [premiumPayments.planId, premiumPayments.planVersion],
    references: [premiumPlans.id, premiumPlans.version],
  }),
  subscription: one(premiumSubscriptions, {
    fields: [premiumPayments.subscriptionId],
    references: [premiumSubscriptions.id],
  }),
}));

export const premiumSubscriptionsRelations = relations(premiumSubscriptions, ({ one, many }) => ({
  plan: one(premiumPlans, {
    fields: [premiumSubscriptions.planId, premiumSubscriptions.planVersion],
    references: [premiumPlans.id, premiumPlans.version],
  }),
  payments: many(premiumPayments),
  addresses: many(premiumSubscriptionAddresses),
}));

export const premiumSubscriptionAddressesRelations = relations(premiumSubscriptionAddresses, ({ one }) => ({
  subscription: one(premiumSubscriptions, {
    fields: [premiumSubscriptionAddresses.subscriptionId],
    references: [premiumSubscriptions.id],
  }),
}));
