import { type DatabaseTransaction, type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import {
  autoRevokeActions,
  autoRevokeObservations,
  autoRevokePermissions,
} from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumSubscriptionAddresses } from '@revoke.cash/core/db/schema/premium';
import type { AutoRevokeActionTransaction } from '@revoke.cash/core/db/types/auto-revoke-transaction';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { and, asc, eq, getTableColumns, gt, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import type { Address, Hash } from 'viem';
import { MAX_PENDING_ACTIONS_PER_CHAIN } from './config';
import type { Observation } from './evaluation/observations';
import { findBillingSubscriptionIds, lockAndCheckBudget } from './execution/budget';

export type ActionRecord = typeof autoRevokeActions.$inferSelect;
export type ActionInsert = typeof autoRevokeActions.$inferInsert;
export type Action = ActionRecord & { observation: Observation };
export type ActionStatus = ActionRecord['status'];

export type ActionErrorCode =
  | 'subscription_inactive'
  | 'missing_permission'
  | 'permission_disabled'
  | 'allowance_not_found'
  | 'token_metadata_unusable'
  | 'rules_no_longer_match'
  | 'excessive_gas'
  | 'per_action_cap'
  | 'awaiting_cheap_gas'
  | 'monthly_budget'
  | 'chain_pipeline_full'
  | 'transient_error'
  | 'nonce_consumed'
  | 'execution_failed'
  | 'transaction_reverted';

export interface ActionFailure {
  status: Extract<ActionStatus, 'blocked_budget' | 'blocked_permission' | 'blocked_rules' | 'failed' | 'skipped'>;
  errorCode: ActionErrorCode;
  nextRetryAt?: Date | null;
}

export type MarkActionSubmittedResult =
  | 'submitted'
  | 'state_changed'
  | 'no_billable_subscription'
  | 'budget_exceeded'
  | 'pipeline_full'
  | 'nonce_conflict';

export type SubmittedTransactionParams = Omit<
  AutoRevokeActionTransaction,
  'txHashes' | 'finalGasUsed' | 'broadcastedAt' | 'minedAt' | 'blockNumber' | 'effectiveGasPrice'
>;

export interface ActionSettlement {
  actionId: string;
  actionStatus: Extract<ActionStatus, 'succeeded' | 'failed'>;
  txHash: Hash;
  finalGasUsed: bigint;
  finalCostUsd: number;
  minedAt: Date | null;
  blockNumber: bigint;
  effectiveGasPrice: bigint;
  errorCode?: ActionErrorCode;
}

const NON_URGENT_ACTION_COOLING_MS = 10 * MINUTE;
const getActionCoolingRetryAt = (triggerType: Observation['triggerType']): Date | null => {
  if (triggerType === 'exploit') return null;
  return new Date(Date.now() + NON_URGENT_ACTION_COOLING_MS);
};

// Creates one action per observation that doesn't have one yet
export const createMissingActions = async (limit: number): Promise<Array<{ id: string }>> => {
  const db = getDb();

  const missingObservations = await db
    .select({
      observationId: autoRevokeObservations.id,
      permissionId: autoRevokePermissions.id,
      chainId: autoRevokeObservations.chainId,
      triggerType: autoRevokeObservations.triggerType,
    })
    .from(autoRevokeObservations)
    .leftJoin(autoRevokeActions, eq(autoRevokeActions.observationId, autoRevokeObservations.id))
    .leftJoin(
      autoRevokePermissions,
      and(
        eq(autoRevokePermissions.address, autoRevokeObservations.address),
        eq(autoRevokePermissions.chainId, autoRevokeObservations.chainId),
        isNull(autoRevokePermissions.revokedAt),
        gt(autoRevokePermissions.expiresAt, new Date()),
      ),
    )
    .where(isNull(autoRevokeActions.id))
    .orderBy(
      sql`case when ${autoRevokeObservations.triggerType} = 'exploit' then 0 else 1 end`,
      asc(autoRevokeObservations.createdAt),
    )
    .limit(limit);

  if (missingObservations.length === 0) return [];

  const actionValues: ActionInsert[] = missingObservations.map((observation) => ({
    observationId: observation.observationId,
    permissionId: observation.permissionId,
    chainId: observation.chainId,
    ...(observation.permissionId
      ? { status: 'queued', nextRetryAt: getActionCoolingRetryAt(observation.triggerType) }
      : {
          status: 'blocked_permission',
          errorCode: 'missing_permission',
        }),
  }));

  return db
    .insert(autoRevokeActions)
    .values(actionValues)
    .onConflictDoNothing()
    .returning({ id: autoRevokeActions.id });
};

export const getActionById = async (actionId: string): Promise<Action | null> => {
  const action = await getDb().query.autoRevokeActions.findFirst({
    where: eq(autoRevokeActions.id, actionId),
    with: { observation: true },
  });

  return action ?? null;
};

// Finds actions that are ready to be processed (queued or previously blocked by budget)
export const findProcessableActions = async (limit: number): Promise<Action[]> => {
  return getDb()
    .select({
      ...getTableColumns(autoRevokeActions),
      observation: getTableColumns(autoRevokeObservations),
    })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId))
    .where(
      or(
        and(
          inArray(autoRevokeActions.status, ['queued', 'blocked_budget']),
          or(isNull(autoRevokeActions.nextRetryAt), lte(autoRevokeActions.nextRetryAt, new Date())),
        ),
        eq(autoRevokeActions.status, 'submitted'),
      ),
    )
    .orderBy(
      sql`case when ${autoRevokeObservations.triggerType} = 'exploit' then 0 else 1 end`,
      asc(autoRevokeActions.createdAt),
    )
    .limit(limit);
};

// Unblocks actions that were previously blocked by a missing permission and now have an active permission
export const unblockActions = async (limit: number): Promise<Array<{ id: string }>> => {
  const db = getTransactionalDb();

  const unblockable = db
    .select({
      actionId: sql<string>`${autoRevokeActions.id}`.as('unblockable_action_id'),
      permissionId: sql<string>`${autoRevokePermissions.id}`.as('unblockable_permission_id'),
    })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId))
    .innerJoin(
      autoRevokePermissions,
      and(
        eq(autoRevokePermissions.address, autoRevokeObservations.address),
        eq(autoRevokePermissions.chainId, autoRevokeObservations.chainId),
        isNull(autoRevokePermissions.revokedAt),
        gt(autoRevokePermissions.expiresAt, new Date()),
      ),
    )
    .where(eq(autoRevokeActions.status, 'blocked_permission'))
    .orderBy(asc(autoRevokeActions.createdAt))
    .limit(limit)
    .as('unblockable');

  return db
    .update(autoRevokeActions)
    .set({
      permissionId: sql`${unblockable.permissionId}`,
      status: 'queued',
      nextRetryAt: null,
      submittedAt: null,
      completedAt: null,
      transaction: null,
      costUsd: null,
      billedSubscriptionId: null,
      errorCode: null,
      costDeferredAt: null,
    })
    .from(unblockable)
    .where(and(eq(autoRevokeActions.id, unblockable.actionId), eq(autoRevokeActions.status, 'blocked_permission')))
    .returning({ id: autoRevokeActions.id });
};

export interface ChainPipelineState {
  count: number;
  minNonce: number | null;
  maxAssignedNonce: number | null;
}

// Returns the number of in-flight actions and the minimum and maximum nonce assigned to them
export const getChainPipelineState = async (
  chainId: number,
  signerAddress: Address,
  writer: DatabaseWriter = getDb(),
): Promise<ChainPipelineState> => {
  const [state] = await writer
    .select({
      count: sql<number>`count(*) filter (where ${autoRevokeActions.status} = 'submitted')::int`,
      minNonce: sql<
        number | null
      >`min(${autoRevokeActions.nonce}) filter (where ${autoRevokeActions.status} = 'submitted')`,
      maxAssignedNonce: sql<number | null>`max(${autoRevokeActions.nonce})`,
    })
    .from(autoRevokeActions)
    .where(
      and(
        eq(autoRevokeActions.signerAddress, signerAddress),
        eq(autoRevokeActions.chainId, chainId),
        isNotNull(autoRevokeActions.nonce),
      ),
    );

  return state ?? { count: 0, minNonce: null, maxAssignedNonce: null };
};

// Locks the action row and performs final authoritative checks before marking it submitted
export const markActionSubmitted = async (
  actionId: string,
  chainId: number,
  signerAddress: Address,
  params: SubmittedTransactionParams & { permissionId: string },
  billing: { address: Address; isUrgent: boolean },
): Promise<MarkActionSubmittedResult> => {
  return getTransactionalDb().transaction(async (trx) => {
    // The pipeline (depth + nonce sequence) is per signing wallet, so the lock is too: the urgent
    // and normal lanes submit on the same chain without serializing against each other.
    await trx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`auto_revoke_chain:${chainId}:${signerAddress.toLowerCase()}`}, 0::bigint))`,
    );

    const pipeline = await getChainPipelineState(chainId, signerAddress, trx);
    if (pipeline.count >= MAX_PENDING_ACTIONS_PER_CHAIN) return 'pipeline_full';

    // Race condition: if a concurrent action claimed the nonce in the meantime, the caller must first get a new nonce.
    if (pipeline.maxAssignedNonce !== null && params.nonce <= pipeline.maxAssignedNonce) return 'nonce_conflict';

    // The action is charged to the oldest billable subscription whose budget admits it
    const billingCandidates = await findBillingSubscriptionIds(trx, billing.address);
    if (billingCandidates.length === 0) return 'no_billable_subscription';

    const billedSubscriptionId = await findSubscriptionWithRemainingBudget(
      trx,
      billingCandidates,
      params.estimatedCostUsd,
      billing.isUrgent,
    );

    if (!billedSubscriptionId) return 'budget_exceeded';

    const [updatedAction] = await trx
      .update(autoRevokeActions)
      .set({
        permissionId: params.permissionId,
        billedSubscriptionId,
        status: 'submitted',
        nonce: params.nonce,
        signerAddress,
        nextRetryAt: null,
        submittedAt: new Date(),
        completedAt: null,
        transaction: {
          ...params,
          txHashes: [params.txHash],
          finalGasUsed: null,
          broadcastedAt: null,
          minedAt: null,
          blockNumber: null,
          effectiveGasPrice: null,
        },
        costUsd: params.estimatedCostUsd,
        errorCode: null,
        costDeferredAt: null,
      })
      .where(and(eq(autoRevokeActions.id, actionId), inArray(autoRevokeActions.status, ['queued', 'blocked_budget'])))
      .returning({ id: autoRevokeActions.id });

    if (!updatedAction) return 'state_changed';

    return 'submitted';
  });
};

const findSubscriptionWithRemainingBudget = async (
  trx: DatabaseTransaction,
  candidates: string[],
  estimatedCostUsd: number | null,
  isUrgent: boolean,
): Promise<string | null> => {
  for (const candidate of candidates) {
    const decision = await lockAndCheckBudget(trx, candidate, estimatedCostUsd, isUrgent);
    if (decision.allowed) return candidate;
  }

  return null;
};

export const requeueRulesBlockedActions = async (addresses: Address[]): Promise<void> => {
  if (addresses.length === 0) return;

  const coolingRetryAt = new Date(Date.now() + NON_URGENT_ACTION_COOLING_MS);

  await getDb()
    .update(autoRevokeActions)
    .set({
      status: 'queued',
      nextRetryAt: sql`case when ${autoRevokeObservations.triggerType} = 'exploit' then null else ${coolingRetryAt}::timestamptz end`,
      errorCode: null,
      costDeferredAt: null,
    })
    .from(autoRevokeObservations)
    .where(
      and(
        eq(autoRevokeActions.status, 'blocked_rules'),
        eq(autoRevokeObservations.id, autoRevokeActions.observationId),
        inArray(autoRevokeObservations.address, addresses),
      ),
    );
};

export const requeueActionAfterNonceConsumed = async (actionId: string): Promise<boolean> => {
  return getTransactionalDb().transaction(async (trx) => {
    // Locks the row and captures the billed subscription before it is cleared below.
    const [current] = await trx
      .select({ billedSubscriptionId: autoRevokeActions.billedSubscriptionId })
      .from(autoRevokeActions)
      .where(and(eq(autoRevokeActions.id, actionId), eq(autoRevokeActions.status, 'submitted')))
      .for('update');

    if (!current) return false;

    await trx
      .update(autoRevokeActions)
      .set({
        status: 'queued',
        nextRetryAt: null,
        submittedAt: null,
        completedAt: null,
        costUsd: null,
        billedSubscriptionId: null,
        errorCode: 'nonce_consumed',
      })
      .where(eq(autoRevokeActions.id, actionId));

    // Clearing the committed cost increases the remaining budget, just like a settlement does.
    if (current.billedSubscriptionId) {
      await wakeBudgetBlockedActions(trx, current.billedSubscriptionId);
    }

    return true;
  });
};

export const markActionReplacementSubmitted = async (
  actionId: string,
  params: SubmittedTransactionParams,
): Promise<boolean> => {
  return getTransactionalDb().transaction(async (trx) => {
    // Lock the row so appending the new hash to txHashes is a race-free read-modify-write; then write
    // the whole rich transaction back through the custom type instead of merging jsonb in raw SQL.
    const [current] = await trx
      .select({ transaction: autoRevokeActions.transaction })
      .from(autoRevokeActions)
      .where(and(eq(autoRevokeActions.id, actionId), eq(autoRevokeActions.status, 'submitted')))
      .for('update');

    if (!current) return false;

    await trx
      .update(autoRevokeActions)
      .set({
        transaction: {
          ...params,
          txHashes: [...(current.transaction?.txHashes ?? []), params.txHash],
          finalGasUsed: null,
          broadcastedAt: null,
          minedAt: null,
          blockNumber: null,
          effectiveGasPrice: null,
        },
        costUsd: params.estimatedCostUsd,
        errorCode: null,
      })
      .where(eq(autoRevokeActions.id, actionId));

    return true;
  });
};

export const markActionBroadcasted = async (actionId: string): Promise<void> => {
  await getTransactionalDb()
    .update(autoRevokeActions)
    .set({
      transaction: sql`
        jsonb_set(
          ${autoRevokeActions.transaction},
          '{broadcastedAt}',
          to_jsonb(coalesce((${autoRevokeActions.transaction}->>'broadcastedAt')::timestamptz, now())),
          true
        )
      `,
    })
    .where(and(eq(autoRevokeActions.id, actionId), eq(autoRevokeActions.status, 'submitted')));
};

// After a transaction is mined, updates the action row with the final gas used and cost
export const settleAction = async (settlement: ActionSettlement): Promise<boolean> => {
  return getTransactionalDb().transaction(async (trx) => {
    const [updatedAction] = await trx
      .update(autoRevokeActions)
      .set({
        status: settlement.actionStatus,
        nextRetryAt: null,
        completedAt: new Date(),
        transaction: sql`
          ${autoRevokeActions.transaction}
          || ${JSON.stringify({
            txHash: settlement.txHash,
            finalGasUsed: settlement.finalGasUsed.toString(),
            minedAt: settlement.minedAt?.toISOString() ?? null,
            blockNumber: settlement.blockNumber.toString(),
            effectiveGasPrice: settlement.effectiveGasPrice.toString(),
          })}::jsonb
        `,
        costUsd: settlement.finalCostUsd,
        errorCode: settlement.errorCode ?? null,
      })
      .where(and(eq(autoRevokeActions.id, settlement.actionId), eq(autoRevokeActions.status, 'submitted')))
      .returning({ billedSubscriptionId: autoRevokeActions.billedSubscriptionId });

    if (!updatedAction) return false;

    // Settlement reconciles the committed estimate down to the realized cost, which can increase the
    // remaining budget mid-month, so the subscription's budget-blocked actions get to retry right away.
    if (updatedAction.billedSubscriptionId) {
      await wakeBudgetBlockedActions(trx, updatedAction.billedSubscriptionId);
    }

    return true;
  });
};

// Wakes the subscription's actions that are parked until the month rollover, letting them retry
// against the remaining budget immediately
const wakeBudgetBlockedActions = async (writer: DatabaseWriter, subscriptionId: string): Promise<void> => {
  const memberObservationIds = writer
    .select({ id: autoRevokeObservations.id })
    .from(autoRevokeObservations)
    .innerJoin(premiumSubscriptionAddresses, eq(premiumSubscriptionAddresses.address, autoRevokeObservations.address))
    .where(eq(premiumSubscriptionAddresses.subscriptionId, subscriptionId));

  await writer
    .update(autoRevokeActions)
    .set({ nextRetryAt: new Date() })
    .where(
      and(
        eq(autoRevokeActions.status, 'blocked_budget'),
        eq(autoRevokeActions.errorCode, 'monthly_budget'),
        inArray(autoRevokeActions.observationId, memberObservationIds),
      ),
    );
};

// Keeps the action retryable after a transient error: only the retry time and error context are
// updated, guarded on status so a concurrent transition to submitted/failed is never overwritten.
export const deferActionRetry = async (
  actionId: string,
  params: { errorCode: ActionErrorCode; nextRetryAt: Date },
): Promise<void> => {
  await getTransactionalDb()
    .update(autoRevokeActions)
    .set({ nextRetryAt: params.nextRetryAt, errorCode: params.errorCode })
    .where(and(eq(autoRevokeActions.id, actionId), inArray(autoRevokeActions.status, ['queued', 'blocked_budget'])));
};

export const markActionFailure = async (actionId: string, failure: ActionFailure): Promise<void> => {
  const isCostDeferral = failure.errorCode === 'per_action_cap' || failure.errorCode === 'awaiting_cheap_gas';

  await getTransactionalDb()
    .update(autoRevokeActions)
    .set({
      status: failure.status,
      nextRetryAt: failure.nextRetryAt ?? null,
      completedAt: failure.status === 'failed' || failure.status === 'skipped' ? new Date() : null,
      errorCode: failure.errorCode,
      costDeferredAt: isCostDeferral ? sql`coalesce(${autoRevokeActions.costDeferredAt}, now())` : undefined,
    })
    .where(
      and(
        eq(autoRevokeActions.id, actionId),
        inArray(autoRevokeActions.status, ['queued', 'blocked_budget', 'blocked_permission']),
      ),
    );
};
