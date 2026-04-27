import { relations, sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgSchema, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { Address, Hash, Hex } from 'viem';
import { premiumSubscriptions } from './premium';

export const autoRevokeSchema = pgSchema('auto_revoke');

export const autoRevokeRulesTypeEnum = autoRevokeSchema.enum('rules_type', ['subscription', 'address']);
export const autoRevokeRiskSensitivityEnum = autoRevokeSchema.enum('risk_sensitivity', [
  'exploits_only',
  'high',
  'medium',
]);
export const autoRevokeTriggerTypeEnum = autoRevokeSchema.enum('trigger_type', ['exploit', 'stale', 'risk_score']);
export const autoRevokeActivityStatusEnum = autoRevokeSchema.enum('activity_status', ['pending', 'executed', 'failed']);

export const autoRevokePermissions = autoRevokeSchema.table(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    address: text('address').notNull().$type<Address>(),
    chainId: integer('chain_id').notNull(),
    permissionContext: text('permission_context').notNull().$type<Hex>(),
    delegationManager: text('delegation_manager').notNull().$type<Address>(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('permissions_address_chain_unique')
      .on(table.address, table.chainId)
      .where(sql`${table.revokedAt} IS NULL`),
    uniqueIndex('permissions_permission_context_unique').on(table.permissionContext),
    index('idx_permissions_address').on(table.address),
  ],
);

export const autoRevokeRules = autoRevokeSchema.table(
  'rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: autoRevokeRulesTypeEnum('type').notNull(),
    // Exactly one of (subscriptionId, address) is non-null per row, matching `type`, enforced by CHECK below.
    subscriptionId: uuid('subscription_id').references(() => premiumSubscriptions.id, { onDelete: 'cascade' }),
    address: text('address').$type<Address>(),
    activeRulesId: uuid('active_rules_id').references((): any => autoRevokeRules.id),
    riskDetectionEnabled: boolean('risk_detection_enabled').notNull().default(true),
    riskSensitivity: autoRevokeRiskSensitivityEnum('risk_sensitivity').notNull().default('exploits_only'),
    staleApprovalEnabled: boolean('stale_approval_enabled').notNull().default(false),
    staleApprovalThresholdDays: integer('stale_approval_threshold_days').default(30),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('rules_subscription_unique').on(table.subscriptionId),
    uniqueIndex('rules_address_unique').on(table.address),
    index('idx_rules_active_rules').on(table.activeRulesId),
    check(
      'rules_owner_consistency',
      sql`(${table.type} = 'subscription' AND ${table.subscriptionId} IS NOT NULL AND ${table.address} IS NULL)
        OR (${table.type} = 'address' AND ${table.subscriptionId} IS NULL AND ${table.address} IS NOT NULL)`,
    ),
  ],
);

export const autoRevokeSubscriptionRulesRelations = relations(autoRevokeRules, ({ one }) => ({
  subscription: one(premiumSubscriptions, {
    fields: [autoRevokeRules.subscriptionId],
    references: [premiumSubscriptions.id],
  }),
}));

export const autoRevokeActivityLog = autoRevokeSchema.table(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    address: text('address').notNull().$type<Address>(),
    chainId: integer('chain_id').notNull(),
    triggerType: autoRevokeTriggerTypeEnum('trigger_type').notNull(),
    spenderAddress: text('spender_address').notNull().$type<Address>(),
    tokenAddress: text('token_address').notNull().$type<Address>(),
    txHash: text('tx_hash').$type<Hash>(),
    status: autoRevokeActivityStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_activity_log_address').on(table.address),
    index('idx_activity_log_created').on(table.createdAt),
  ],
);
