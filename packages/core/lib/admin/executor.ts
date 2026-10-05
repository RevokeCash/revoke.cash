import { getChainPipelineState } from '@revoke.cash/core/auto-revoke/actions';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import type { ExecutionLane } from '@revoke.cash/core/auto-revoke/execution/signer';
import { createViemPublicClientForChain, getChainNativeToken } from '@revoke.cash/core/chains';
import { AUTO_REVOKE_EXECUTOR_HOT_ADDRESS, AUTO_REVOKE_URGENT_EXECUTOR_HOT_ADDRESS } from '@revoke.cash/core/constants';
import { type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import {
  autoRevokeActions,
  autoRevokeObservations,
  autoRevokePermissions,
} from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { activeSubscriptionsQuery } from '@revoke.cash/core/premium/subscriptions';
import { getNativeTokenPriceUsd } from '@revoke.cash/core/prices';
import { MINUTE } from '@revoke.cash/core/utils/time';
import {
  and,
  asc,
  desc,
  eq,
  exists,
  getTableColumns,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { type Address, formatEther, isAddressEqual } from 'viem';

export const EXECUTOR_WALLETS: Array<{ lane: ExecutionLane; address: Address }> = [
  { lane: 'normal', address: AUTO_REVOKE_EXECUTOR_HOT_ADDRESS },
  { lane: 'urgent', address: AUTO_REVOKE_URGENT_EXECUTOR_HOT_ADDRESS },
];

// The executor wallets were first funded in July 2026, so there is no executor gas activity before that
export const EXECUTOR_WALLETS_FIRST_FUNDED_AT = new Date('2026-07-01T00:00:00.000Z');

export const laneForSigner = (signerAddress: Address | null): ExecutionLane | null => {
  if (!signerAddress) return null;
  return EXECUTOR_WALLETS.find((wallet) => isAddressEqual(wallet.address, signerAddress))?.lane ?? null;
};

export interface ExecutorGasBalance {
  lane: ExecutionLane;
  address: Address;
  chainId: number;
  nativeToken: string;
  // Balance as a decimal string in whole native tokens; null when the RPC call failed
  balance: string | null;
  balanceUsd: number | null;
  nativeTokenPriceUsd: number | null;
}

export const getExecutorGasBalances = async (): Promise<ExecutorGasBalance[]> => {
  const balancesByChain = await Promise.all(
    AUTO_REVOKE_SUPPORTED_CHAINS.map(async (chainId) => {
      const publicClient = createViemPublicClientForChain(chainId);
      const nativeTokenPriceUsd = await getNativeTokenPriceUsd(chainId).catch(() => null);

      return Promise.all(
        EXECUTOR_WALLETS.map(async ({ lane, address }): Promise<ExecutorGasBalance> => {
          const balanceWei = await publicClient.getBalance({ address }).catch(() => null);
          const balance = balanceWei !== null ? formatEther(balanceWei) : null;
          const balanceUsd =
            balance !== null && nativeTokenPriceUsd !== null ? Number(balance) * nativeTokenPriceUsd : null;

          return {
            lane,
            address,
            chainId,
            nativeToken: getChainNativeToken(chainId),
            balance,
            balanceUsd,
            nativeTokenPriceUsd,
          };
        }),
      );
    }),
  );

  return balancesByChain.flat();
};

export interface ExecutorSpend {
  lane: ExecutionLane;
  chainId: number;
  actionCount: number;
  spendUsd: number;
}

// Gas spend per lane and chain over a trailing window, using the same status set as budget accounting
export const getExecutorSpend = async (days: number): Promise<ExecutorSpend[]> => {
  const from = new Date(Date.now() - days * 24 * 60 * MINUTE);

  const rows = await getDb()
    .select({
      signerAddress: autoRevokeActions.signerAddress,
      chainId: autoRevokeActions.chainId,
      actionCount: sql<number>`count(*)::int`,
      spendUsd: sql<number>`coalesce(sum(${autoRevokeActions.costUsd}), 0)::float`,
    })
    .from(autoRevokeActions)
    .where(
      and(
        inArray(autoRevokeActions.status, ['submitted', 'succeeded', 'failed']),
        isNotNull(autoRevokeActions.signerAddress),
        gte(autoRevokeActions.submittedAt, from),
      ),
    )
    .groupBy(autoRevokeActions.signerAddress, autoRevokeActions.chainId);

  return rows
    .map((row) => ({
      lane: laneForSigner(row.signerAddress),
      chainId: row.chainId,
      actionCount: row.actionCount,
      spendUsd: row.spendUsd,
    }))
    .filter((row): row is ExecutorSpend => row.lane !== null);
};

export interface ExecutorPipeline {
  lane: ExecutionLane;
  chainId: number;
  inFlightCount: number;
  minNonce: number | null;
  maxAssignedNonce: number | null;
}

export const getExecutorPipelines = async (): Promise<ExecutorPipeline[]> => {
  const pipelines = await Promise.all(
    AUTO_REVOKE_SUPPORTED_CHAINS.flatMap((chainId) =>
      EXECUTOR_WALLETS.map(async ({ lane, address }): Promise<ExecutorPipeline> => {
        const state = await getChainPipelineState(chainId, address);
        return {
          lane,
          chainId,
          inFlightCount: state.count,
          minNonce: state.minNonce,
          maxAssignedNonce: state.maxAssignedNonce,
        };
      }),
    ),
  );

  return pipelines.filter((pipeline) => pipeline.maxAssignedNonce !== null);
};

export interface ProblemAction {
  id: string;
  chainId: number;
  address: Address;
  lane: ExecutionLane | null;
  status: string;
  errorCode: string | null;
  nonce: number | null;
  txHash: string | null;
  submittedAt: string | null;
  costDeferredAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  bumpCount: number;
}

const STUCK_SUBMITTED_AGE = 30 * MINUTE;

// The original transaction plus two fee bumps
const STUCK_SUBMITTED_TRANSACTION_COUNT = 3;

// Submitted actions whose transaction has not settled within the expected confirmation window. Every fee bump
// resets submitted_at, so a head that keeps getting bumped is caught by its transaction count instead.
export const stuckSubmittedConditions = () =>
  and(
    eq(autoRevokeActions.status, 'submitted'),
    or(
      lt(autoRevokeActions.submittedAt, new Date(Date.now() - STUCK_SUBMITTED_AGE)),
      sql`jsonb_array_length(${autoRevokeActions.transaction} -> 'txHashes') >= ${STUCK_SUBMITTED_TRANSACTION_COUNT}`,
    ),
  );

export const getStuckSubmittedActions = async (): Promise<ProblemAction[]> => {
  const rows = await getDb()
    .select({ ...getTableColumns(autoRevokeActions), address: autoRevokeObservations.address })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId))
    .where(stuckSubmittedConditions())
    .orderBy(desc(autoRevokeActions.submittedAt));

  return rows.map(mapProblemAction);
};

// Actions waiting for cheaper gas (soft cap) or blocked on cost caps
export const getDeferredActions = async (): Promise<ProblemAction[]> => {
  const rows = await getDb()
    .select({ ...getTableColumns(autoRevokeActions), address: autoRevokeObservations.address })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId))
    .where(
      and(inArray(autoRevokeActions.status, ['queued', 'blocked_budget']), isNotNull(autoRevokeActions.costDeferredAt)),
    )
    .orderBy(desc(autoRevokeActions.costDeferredAt));

  return rows.map(mapProblemAction);
};

type ProblemActionRow = typeof autoRevokeActions.$inferSelect & { address: Address };

const mapProblemAction = (row: ProblemActionRow): ProblemAction => ({
  id: row.id,
  chainId: row.chainId,
  address: row.address,
  lane: laneForSigner(row.signerAddress),
  status: row.status,
  errorCode: row.errorCode,
  nonce: row.nonce,
  txHash: row.transaction?.txHash ?? null,
  submittedAt: row.submittedAt?.toISOString() ?? null,
  costDeferredAt: row.costDeferredAt?.toISOString() ?? null,
  nextRetryAt: row.nextRetryAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  bumpCount: Math.max((row.transaction?.txHashes ?? []).length - 1, 0),
});

export interface NotUpgradedWallet {
  address: Address;
  chainId: number;
  // The subscription that pays for this wallet's revokes (earliest started, as in findBillingSubscriptionIds)
  subscriptionId: string;
  permissionCreatedAt: string;
  blockedActionCount: number;
  // Sum over the blocked actions; null when there are none or none of them has a known value
  valueAtRiskUsd: number | null;
}

// Live permissions of Ultimate wallets that cannot execute until the wallet upgrades to the MetaMask smart account
export const notUpgradedPermissionConditions = (db: DatabaseWriter) =>
  and(
    inArray(autoRevokePermissions.chainId, [...AUTO_REVOKE_SUPPORTED_CHAINS]),
    isNull(autoRevokePermissions.revokedAt),
    gt(autoRevokePermissions.expiresAt, new Date()),
    eq(autoRevokePermissions.accountUpgraded, false),
    exists(activeSubscriptionsQuery(db, autoRevokePermissions.address, 'ultimate')),
  );

export const getNotUpgradedWallets = async (): Promise<NotUpgradedWallet[]> => {
  const db = getDb();

  // unblockActions only wakes blocked_permission actions once their wallet's permission on that chain is upgraded
  const blockedActions = db
    .select({
      address: autoRevokeObservations.address,
      chainId: autoRevokeObservations.chainId,
      actionCount: sql<number>`count(*)::int`.as('blocked_action_count'),
      valueAtRiskUsd: sql<number | null>`sum(${autoRevokeObservations.valueAtRiskUsd})::float`.as(
        'blocked_value_at_risk_usd',
      ),
    })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId))
    .where(eq(autoRevokeActions.status, 'blocked_permission'))
    .groupBy(autoRevokeObservations.address, autoRevokeObservations.chainId)
    .as('blocked_actions');

  const billingSubscriptionId = activeSubscriptionsQuery(db, autoRevokePermissions.address, 'ultimate')
    .orderBy(asc(premiumSubscriptions.startsAt), asc(premiumSubscriptions.id))
    .limit(1);

  const rows = await db
    .select({
      address: autoRevokePermissions.address,
      chainId: autoRevokePermissions.chainId,
      subscriptionId: sql<string>`${billingSubscriptionId}`,
      permissionCreatedAt: autoRevokePermissions.createdAt,
      blockedActionCount: blockedActions.actionCount,
      valueAtRiskUsd: blockedActions.valueAtRiskUsd,
    })
    .from(autoRevokePermissions)
    .leftJoin(
      blockedActions,
      and(
        eq(blockedActions.address, autoRevokePermissions.address),
        eq(blockedActions.chainId, autoRevokePermissions.chainId),
      ),
    )
    .where(notUpgradedPermissionConditions(db))
    .orderBy(sql`${blockedActions.valueAtRiskUsd} desc nulls last`, asc(autoRevokePermissions.createdAt));

  return rows.map((row) => ({
    ...row,
    permissionCreatedAt: row.permissionCreatedAt.toISOString(),
    blockedActionCount: row.blockedActionCount ?? 0,
  }));
};
