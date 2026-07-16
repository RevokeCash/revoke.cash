import type { AuditAction, AuditActionDetails } from '@revoke.cash/core/audit/actions';
import { getDb } from '@revoke.cash/core/db/client';
import { auditEvents } from '@revoke.cash/core/db/schema/audit';
import type { Address } from 'viem';

interface RecordAuditEventParams<TAction extends AuditAction> {
  action: TAction;
  actorAddress: Address;
  details: AuditActionDetails[TAction];
  targetAddress?: Address;
  subscriptionId?: string;
  chainId?: number;
}

// Recording is best-effort: the audited action has already committed, so a failing audit insert
// must never turn a succeeded request into an error.
export const recordAuditEvent = async <TAction extends AuditAction>(
  params: RecordAuditEventParams<TAction>,
): Promise<void> => {
  try {
    await getDb().insert(auditEvents).values({
      action: params.action,
      actorAddress: params.actorAddress,
      targetAddress: params.targetAddress,
      subscriptionId: params.subscriptionId,
      chainId: params.chainId,
      details: params.details,
    });
  } catch (error) {
    console.error(`Failed to record audit event '${params.action}':`, error);
  }
};
