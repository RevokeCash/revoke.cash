import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Hash, Hex } from 'viem';
import { AllowanceType } from '../../allowances';
import type { AutoRevokeRules, AutoRevokeRulesSource } from '../../auto-revoke/types';
import { lowercaseAddress } from '../types';
import { premiumSubscriptions } from './premium';

export const autoRevokeSchema = pgSchema('auto_revoke');

export const autoRevokeRulesTypeEnum = autoRevokeSchema.enum('rules_type', ['subscription', 'address']);
export const autoRevokeRiskSensitivityEnum = autoRevokeSchema.enum('risk_sensitivity', [
  'exploits_only',
  'high',
  'medium',
]);
export const autoRevokeTriggerTypeEnum = autoRevokeSchema.enum('trigger_type', ['exploit', 'stale', 'risk_score']);
// Mirrors indexer.allowance_type; kept as a separate type to keep the auto_revoke schema self-contained.
export const autoRevokeAllowanceTypeEnum = autoRevokeSchema.enum(
  'allowance_type',
  Object.values(AllowanceType) as [AllowanceType, ...AllowanceType[]],
);

export const autoRevokePermissions = autoRevokeSchema.table(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    address: lowercaseAddress('address').notNull(),
    chainId: integer('chain_id').notNull(),
    permissionContext: text('permission_context').notNull().$type<Hex>(),
    delegationManager: lowercaseAddress('delegation_manager').notNull(),
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
    address: lowercaseAddress('address'),
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

export interface AutoRevokeTriggerDetails {
  matchedTriggers: Array<{
    type: 'exploit' | 'risk_score' | 'stale';
    riskFactors?: Array<{ type: string; source: string; data?: string }>;
  }>;
}

export interface AutoRevokeRuleSnapshot {
  rules: AutoRevokeRules;
  rulesSource: AutoRevokeRulesSource;
}

export const autoRevokeObservations = autoRevokeSchema.table(
  'observations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => premiumSubscriptions.id, { onDelete: 'cascade' }),
    address: lowercaseAddress('address').notNull(),
    chainId: integer('chain_id').notNull(),
    triggerType: autoRevokeTriggerTypeEnum('trigger_type').notNull(),
    triggerDetails: jsonb('trigger_details').notNull().$type<AutoRevokeTriggerDetails>(),
    ruleSnapshot: jsonb('rule_snapshot').notNull().$type<AutoRevokeRuleSnapshot>(),
    allowanceFingerprint: text('allowance_fingerprint').notNull(),
    allowanceType: autoRevokeAllowanceTypeEnum('allowance_type').notNull(),
    tokenAddress: lowercaseAddress('token_address').notNull(),
    spenderAddress: lowercaseAddress('spender_address').notNull(),
    tokenId: numeric('token_id', { mode: 'bigint' }),
    permit2Address: lowercaseAddress('permit2_address'),
    expiration: bigint('expiration', { mode: 'number' }),
    lastUpdatedTxHash: text('last_updated_tx_hash').notNull().$type<Hash>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('observations_subscription_allowance_fingerprint_unique').on(
      table.subscriptionId,
      table.allowanceFingerprint,
    ),
    index('idx_observations_address_created').on(table.address, table.createdAt),
    index('idx_observations_subscription').on(table.subscriptionId),
  ],
);

export const autoRevokeObservationsRelations = relations(autoRevokeObservations, ({ one }) => ({
  subscription: one(premiumSubscriptions, {
    fields: [autoRevokeObservations.subscriptionId],
    references: [premiumSubscriptions.id],
  }),
}));
