import { type DatabaseTransaction, type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import {
  autoRevokeActions,
  autoRevokeObservations,
  autoRevokePermissions,
} from '@revoke.cash/core/db/schema/auto-revoke';
import type { AutoRevokeActionTransaction } from '@revoke.cash/core/db/types/auto-revoke-transaction';
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
  | 'monthly_budget'
  | 'chain_pipeline_full'
  | 'transient_error'
  | 'nonce_consumed'
  | 'execution_failed'
  | 'transaction_reverted';

export interface ActionFailure {
  status: Extract<ActionStatus, 'blocked_budget' | 'blocked_permission' | 'failed' | 'skipped'>;
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
  'txHashes' | 'finalGasUsed' | 'broadcastedAt'
> & {
  estimatedCostUsd: number | null;
};

export interface ActionSettlement {
  actionId: string;
  actionStatus: Extract<ActionStatus, 'succeeded' | 'failed'>;
  txHash: Hash;
  finalGasUsed: bigint;
  finalCostUsd: number;
  errorCode?: ActionErrorCode;
}

// Creates one action per observation that doesn't have one yet
export const createMissingActions = async (limit: number): Promise<Array<{ id: string }>> => {
  const db = getDb();

  const missingObservations = await db
    .select({
      observationId: autoRevokeObservations.id,
      permissionId: autoRevokePermissions.id,
      chainId: autoRevokeObservations.chainId,
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
    ...observation,
    ...(observation.permissionId
      ? { status: 'queued' }
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
  billing: { address: Address; estimatedCostUsd: number; enforceBudget: boolean },
): Promise<MarkActionSubmittedResult> => {
  return getTransactionalDb().transaction(async (trx) => {
    await trx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`auto_revoke_chain:${chainId}`}, 0::bigint))`,
    );

    const pipeline = await getChainPipelineState(chainId, signerAddress, trx);
    if (pipeline.count >= MAX_PENDING_ACTIONS_PER_CHAIN) return 'pipeline_full';

    // Race condition: if a concurrent action claimed the nonce in the meantime, the caller must first get a new nonce.
    if (pipeline.maxAssignedNonce !== null && params.nonce <= pipeline.maxAssignedNonce) return 'nonce_conflict';

    // The action is charged to the oldest billable subscription that still has budget for it
    const billingCandidates = await findBillingSubscriptionIds(trx, billing.address);
    if (billingCandidates.length === 0) return 'no_billable_subscription';

    const billedSubscriptionId = billing.enforceBudget
      ? await findSubscriptionWithHeadroom(trx, billingCandidates, billing.estimatedCostUsd)
      : billingCandidates[0];

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
        },
        costUsd: params.estimatedCostUsd,
        errorCode: null,
      })
      .where(and(eq(autoRevokeActions.id, actionId), inArray(autoRevokeActions.status, ['queued', 'blocked_budget'])))
      .returning({ id: autoRevokeActions.id });

    if (!updatedAction) return 'state_changed';

    return 'submitted';
  });
};

const findSubscriptionWithHeadroom = async (
  trx: DatabaseTransaction,
  candidates: string[],
  estimatedCostUsd: number,
): Promise<string | null> => {
  for (const candidate of candidates) {
    const decision = await lockAndCheckBudget(trx, candidate, estimatedCostUsd);
    if (decision.allowed) return candidate;
  }

  return null;
};

export const requeueActionAfterNonceConsumed = async (actionId: string): Promise<boolean> => {
  const [updatedAction] = await getTransactionalDb()
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
    .where(and(eq(autoRevokeActions.id, actionId), eq(autoRevokeActions.status, 'submitted')))
    .returning({ id: autoRevokeActions.id });

  return Boolean(updatedAction);
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
  const [updatedAction] = await getTransactionalDb()
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
          })}::jsonb
        `,
      costUsd: settlement.finalCostUsd,
      errorCode: settlement.errorCode ?? null,
    })
    .where(and(eq(autoRevokeActions.id, settlement.actionId), eq(autoRevokeActions.status, 'submitted')))
    .returning({ id: autoRevokeActions.id });

  return Boolean(updatedAction);
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
  await getTransactionalDb()
    .update(autoRevokeActions)
    .set({
      status: failure.status,
      nextRetryAt: failure.nextRetryAt ?? null,
      completedAt: failure.status === 'failed' || failure.status === 'skipped' ? new Date() : null,
      errorCode: failure.errorCode,
    })
    .where(
      and(
        eq(autoRevokeActions.id, actionId),
        inArray(autoRevokeActions.status, ['queued', 'blocked_budget', 'blocked_permission']),
      ),
    );
};
