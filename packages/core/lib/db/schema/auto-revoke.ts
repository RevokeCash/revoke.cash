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
import type { ActionErrorCode } from '../../auto-revoke/actions';
import type { RuleContext, TriggerDetails } from '../../auto-revoke/evaluation/rules';
import { autoRevokeTransaction } from '../types/auto-revoke-transaction';
import { lowercaseAddress } from '../types/lowercase-address';
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
export const autoRevokeActionStatusEnum = autoRevokeSchema.enum('action_status', [
  'queued',
  'blocked_budget',
  'blocked_permission',
  'blocked_rules',
  'submitted',
  'succeeded',
  'failed',
  'skipped',
]);

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
    activeRulesId: uuid('active_rules_id').references((): any => autoRevokeRules.id, { onDelete: 'set null' }),
    riskDetectionEnabled: boolean('risk_detection_enabled').notNull().default(true),
    riskSensitivity: autoRevokeRiskSensitivityEnum('risk_sensitivity').notNull().default('exploits_only'),
    staleApprovalEnabled: boolean('stale_approval_enabled').notNull().default(false),
    staleApprovalThresholdDays: integer('stale_approval_threshold_days').notNull().default(180),
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
    // The pointer only has meaning on address rows, where NULL is the explicit "custom rules" choice.
    check('rules_pointer_scope', sql`${table.type} = 'address' OR ${table.activeRulesId} IS NULL`),
  ],
);

export const autoRevokeSubscriptionRulesRelations = relations(autoRevokeRules, ({ one }) => ({
  subscription: one(premiumSubscriptions, {
    fields: [autoRevokeRules.subscriptionId],
    references: [premiumSubscriptions.id],
  }),
}));

export const autoRevokeObservations = autoRevokeSchema.table(
  'observations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    address: lowercaseAddress('address').notNull(),
    chainId: integer('chain_id').notNull(),
    triggerType: autoRevokeTriggerTypeEnum('trigger_type').notNull(),
    triggerDetails: jsonb('trigger_details').notNull().$type<TriggerDetails>(),
    ruleSnapshot: jsonb('rule_snapshot').notNull().$type<RuleContext>(),
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
    uniqueIndex('observations_allowance_fingerprint_unique').on(table.allowanceFingerprint),
    index('idx_observations_address_created').on(table.address, table.createdAt),
  ],
);

export const autoRevokeActions = autoRevokeSchema.table(
  'actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    observationId: uuid('observation_id')
      .notNull()
      .references(() => autoRevokeObservations.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id').references(() => autoRevokePermissions.id),
    billedSubscriptionId: uuid('billed_subscription_id').references(() => premiumSubscriptions.id),
    status: autoRevokeActionStatusEnum('status').notNull().default('queued'),
    chainId: integer('chain_id').notNull(),
    // The assigned nonce and signing wallet, write-once at submission. These back the per-signer
    // per-chain monotone nonce floor, so they survive requeues and are never cleared.
    nonce: integer('nonce'),
    signerAddress: lowercaseAddress('signer_address'),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    transaction: autoRevokeTransaction('transaction'),
    costUsd: numeric('cost_usd', { mode: 'number' }),
    errorCode: text('error_code').$type<ActionErrorCode>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('actions_observation_unique').on(table.observationId),
    index('idx_actions_status_retry').on(table.status, table.nextRetryAt),
    index('idx_actions_signer_chain_nonce')
      .on(table.signerAddress, table.chainId, table.nonce)
      .where(sql`${table.nonce} is not null`),
    index('idx_actions_billed_subscription')
      .on(table.billedSubscriptionId, table.submittedAt)
      .where(sql`${table.billedSubscriptionId} is not null`),
  ],
);

export const autoRevokeObservationsRelations = relations(autoRevokeObservations, ({ many }) => ({
  actions: many(autoRevokeActions),
}));

export const autoRevokeActionsRelations = relations(autoRevokeActions, ({ one }) => ({
  observation: one(autoRevokeObservations, {
    fields: [autoRevokeActions.observationId],
    references: [autoRevokeObservations.id],
  }),
  permission: one(autoRevokePermissions, {
    fields: [autoRevokeActions.permissionId],
    references: [autoRevokePermissions.id],
  }),
  billedSubscription: one(premiumSubscriptions, {
    fields: [autoRevokeActions.billedSubscriptionId],
    references: [premiumSubscriptions.id],
  }),
}));
