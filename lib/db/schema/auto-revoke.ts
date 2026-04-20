import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { premiumSubscriptions } from './premium';

export const autoRevokeRulesTypeEnum = pgEnum('auto_revoke_rules_type', ['subscription', 'address']);
export const autoRevokeRiskSensitivityEnum = pgEnum('auto_revoke_risk_sensitivity', [
  'exploits_only',
  'high',
  'medium',
]);
export const autoRevokeTriggerTypeEnum = pgEnum('auto_revoke_trigger_type', ['exploit', 'stale', 'risk_score']);
export const autoRevokeActivityStatusEnum = pgEnum('auto_revoke_activity_status', ['pending', 'executed', 'failed']);

export const autoRevokePermissions = pgTable(
  'auto_revoke_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    address: text('address').notNull(),
    chainId: integer('chain_id').notNull(),
    permissionContext: text('permission_context').notNull(),
    delegationManager: text('delegation_manager').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('auto_revoke_permissions_address_chain_unique')
      .on(table.address, table.chainId)
      .where(sql`${table.revokedAt} IS NULL`),
    uniqueIndex('auto_revoke_permissions_permission_context_unique').on(table.permissionContext),
    index('idx_auto_revoke_permissions_address').on(table.address),
  ],
);

export const autoRevokeRules = pgTable(
  'auto_revoke_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: autoRevokeRulesTypeEnum('type').notNull(),
    // Exactly one of (subscriptionId, address) is non-null per row, matching `type`, enforced by CHECK below.
    subscriptionId: uuid('subscription_id').references(() => premiumSubscriptions.id, { onDelete: 'cascade' }),
    address: text('address'),
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
    uniqueIndex('auto_revoke_rules_subscription_unique').on(table.subscriptionId),
    uniqueIndex('auto_revoke_rules_address_unique').on(table.address),
    index('idx_auto_revoke_rules_active_rules').on(table.activeRulesId),
    check(
      'auto_revoke_rules_owner_consistency',
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

export const autoRevokeActivityLog = pgTable(
  'auto_revoke_activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    address: text('address').notNull(),
    chainId: integer('chain_id').notNull(),
    triggerType: autoRevokeTriggerTypeEnum('trigger_type').notNull(),
    spenderAddress: text('spender_address').notNull(),
    tokenAddress: text('token_address').notNull(),
    txHash: text('tx_hash'),
    status: autoRevokeActivityStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_auto_revoke_activity_address').on(table.address),
    index('idx_auto_revoke_activity_created').on(table.createdAt),
  ],
);
