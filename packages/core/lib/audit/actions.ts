// Pure audit action definitions with no database imports, so client components can import them.
import type { AutoRevokeRules } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import type { ProcessRefundOutcome } from '@revoke.cash/core/premium/refunds';

// Each entry maps an audit action to the details stored in its jsonb column. Identifying context
// (actor, target address, subscription, chain) lives in dedicated columns, so details only carry
// what is specific to the action.
export interface AuditActionDetails {
  signed_in: Record<string, never>;
  payment_created: { paymentId: string; planId: string; amountUsdCents: number };
  refund_requested: { refundRequestId: string; paymentId: string };
  subscription_address_added: Record<string, never>;
  subscription_address_removed: Record<string, never>;
  auto_revoke_permission_granted: { permissionId: string; expiresAt: string };
  auto_revoke_permission_revoked: Record<string, never>;
  auto_revoke_permissions_synced: { syncedChainIds: number[]; revokedChainIds: number[] };
  auto_revoke_rules_updated: Partial<AutoRevokeRules>;
  auto_revoke_subscription_rules_updated: Partial<AutoRevokeRules>;
  auto_revoke_rules_source_switched: { subscriptionId: string | null };
  admin_refund_processed: { refundRequestId: string; refundTxHash: string; outcome: ProcessRefundOutcome };
  admin_refund_dismissed: { refundRequestId: string };
  admin_payment_reconciled: { paymentId: string; status: string };
  admin_subscription_granted: { paymentId: string; planId: string; durationDays: number; reason: string | null };
  admin_subscription_rebuilt: Record<string, never>;
  admin_indexing_reset: { resetChainCount: number };
  admin_auto_revoke_action_retried: { actionId: string };
}

export type AuditAction = keyof AuditActionDetails;
export type AuditEventDetails = AuditActionDetails[AuditAction];

export const AUDIT_ACTIONS = [
  'signed_in',
  'payment_created',
  'refund_requested',
  'subscription_address_added',
  'subscription_address_removed',
  'auto_revoke_permission_granted',
  'auto_revoke_permission_revoked',
  'auto_revoke_permissions_synced',
  'auto_revoke_rules_updated',
  'auto_revoke_subscription_rules_updated',
  'auto_revoke_rules_source_switched',
  'admin_refund_processed',
  'admin_refund_dismissed',
  'admin_payment_reconciled',
  'admin_subscription_granted',
  'admin_subscription_rebuilt',
  'admin_indexing_reset',
  'admin_auto_revoke_action_retried',
] as const satisfies readonly AuditAction[];

// Compile-time check: errors if any AuditActionDetails key is missing from AUDIT_ACTIONS.
type MissingAuditActions = Exclude<AuditAction, (typeof AUDIT_ACTIONS)[number]>;
type AssertNever<T extends never> = T;
type _EveryAuditActionListed = AssertNever<MissingAuditActions>;
