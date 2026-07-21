import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions } from '@revoke.cash/core/db/schema/auto-revoke';
import { indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { premiumPayments, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { acquireAdvisoryLock } from '@revoke.cash/core/db/utils';
import type { PaymentStatusResponse } from '@revoke.cash/core/premium/payments';
import { getPremiumPlanById } from '@revoke.cash/core/premium/plans';
import {
  findOrCreateSubscriptionForOwner,
  rebuildSubscriptionFromPayments,
} from '@revoke.cash/core/premium/subscriptions';
import { reconcilePaymentByOwner } from '@revoke.cash/core/premium/verify-payment';
import { and, eq, inArray } from 'drizzle-orm';
import { type Address, zeroAddress } from 'viem';

// Makes a parked action eligible on the executor's next poll. Submitted rows are executor-owned
// (their nonce pipeline must not be disturbed) and settled rows are final, so neither is touched.
export const retryActionNow = async (actionId: string): Promise<boolean> => {
  const updatedRows = await getTransactionalDb()
    .update(autoRevokeActions)
    .set({ nextRetryAt: new Date() })
    .where(
      and(
        eq(autoRevokeActions.id, actionId),
        inArray(autoRevokeActions.status, ['queued', 'blocked_budget', 'blocked_permission', 'blocked_rules']),
      ),
    )
    .returning({ id: autoRevokeActions.id });

  return updatedRows.length > 0;
};

// Re-enables indexing for all of an address's chain rows. The indexer manager's scheduler polls
// next_run_at, so setting it to now() is enough for the rows to be picked up again. Rows for
// chains that were removed from the chain config stay disabled — they can never be indexed.
export const resetAddressIndexing = async (address: Address): Promise<number> => {
  const updatedRows = await getTransactionalDb()
    .update(indexerEventsState)
    .set({ disabledAt: null, consecutiveFailures: 0, lastError: null, nextRunAt: new Date() })
    .where(and(eq(indexerEventsState.address, address), inArray(indexerEventsState.chainId, [...ORDERED_CHAINS])))
    .returning({ chainId: indexerEventsState.chainId });

  return updatedRows.length;
};

// The reconcile cron only touches pending payments, so an expired quote whose transfer landed
// late is never rescanned. The admin reconcile revives it to pending first; the regular
// reconciliation then either confirms it against a matching transfer (with the usual row lock
// and unique matched-tx-hash protections) or flips it back to expired.
export const reconcilePaymentAsAdmin = async (
  paymentId: string,
): Promise<(PaymentStatusResponse & { ownerAddress: Address }) | null> => {
  const payment = await getDb().query.premiumPayments.findFirst({
    where: eq(premiumPayments.id, paymentId),
    columns: { ownerAddress: true, status: true },
  });
  if (!payment) return null;

  if (payment.status === 'expired') {
    await getTransactionalDb()
      .update(premiumPayments)
      .set({ status: 'pending' })
      .where(and(eq(premiumPayments.id, paymentId), eq(premiumPayments.status, 'expired')));
  }

  const paymentStatus = await reconcilePaymentByOwner(paymentId, payment.ownerAddress);
  if (!paymentStatus) return null;

  return { ...paymentStatus, ownerAddress: payment.ownerAddress };
};

export interface GrantSubscriptionParams {
  ownerAddress: Address;
  planId: string;
  durationDays: number;
  reason: string | null;
  grantedBy: Address;
}

export interface GrantSubscriptionResult {
  subscriptionId: string;
  paymentId: string;
  endsAt: string;
}

// Grants complimentary subscription time by inserting a payment row that is born 'confirmed'
// with no on-chain transfer and a $0 amount, then replaying the subscription's payments. The
// NULL matched_tx_hash keeps it out of the re-verification sweep, and the $0 amount keeps
// revenue aggregates unaffected. The NOT NULL token and chain columns carry inert placeholder
// values; they are only read when matching a payment on-chain, which never happens here.
// Returns null when the plan does not exist.
export const grantSubscriptionAsAdmin = async (
  params: GrantSubscriptionParams,
): Promise<GrantSubscriptionResult | null> => {
  const plan = await getPremiumPlanById(params.planId);
  if (!plan) return null;

  return getTransactionalDb().transaction(async (trx) => {
    const now = new Date();

    // Takes the same owner advisory lock as the payment-confirmation path
    const subscriptionId = await findOrCreateSubscriptionForOwner(trx, {
      ownerAddress: params.ownerAddress,
      planId: plan.id,
      planVersion: plan.version,
      plan,
      now,
    });

    const [grantedPayment] = await trx
      .insert(premiumPayments)
      .values({
        planId: plan.id,
        planVersion: plan.version,
        ownerAddress: params.ownerAddress,
        subscriptionId,
        chainId: 0,
        tokenAddress: zeroAddress,
        tokenSymbol: 'USDC',
        tokenDecimals: 6,
        amountUsdCents: 0,
        status: 'confirmed',
        expiresAt: now,
        scanFromBlock: 0n,
        confirmedAt: now,
        grantedBy: params.grantedBy,
        grantReason: params.reason,
        grantedDurationDays: params.durationDays,
      })
      .returning({ id: premiumPayments.id });

    await rebuildSubscriptionFromPayments(trx, subscriptionId);

    const [subscription] = await trx
      .select({ endsAt: premiumSubscriptions.endsAt })
      .from(premiumSubscriptions)
      .where(eq(premiumSubscriptions.id, subscriptionId));

    return { subscriptionId, paymentId: grantedPayment.id, endsAt: subscription.endsAt.toISOString() };
  });
};

// Recomputes the subscription's plan and end date by replaying its confirmed payments in order.
// Returns false when the subscription does not exist.
export const rebuildSubscriptionAsAdmin = async (subscriptionId: string): Promise<boolean> => {
  return getTransactionalDb().transaction(async (trx) => {
    const subscription = await trx.query.premiumSubscriptions.findFirst({
      where: eq(premiumSubscriptions.id, subscriptionId),
      columns: { ownerAddress: true },
    });
    if (!subscription) return false;

    // The same lock the payment-confirmation path takes, so the rebuild cannot race a confirmation
    await acquireAdvisoryLock(trx, `premium_subscription_owner:${subscription.ownerAddress.toLowerCase()}`);
    await rebuildSubscriptionFromPayments(trx, subscriptionId);
    return true;
  });
};
