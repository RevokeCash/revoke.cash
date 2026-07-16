import { getChainPipelineState } from '@revoke.cash/core/auto-revoke/actions';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import type { ExecutionLane } from '@revoke.cash/core/auto-revoke/execution/signer';
import { createViemPublicClientForChain, getChainNativeToken } from '@revoke.cash/core/chains';
import { AUTO_REVOKE_EXECUTOR_HOT_ADDRESS, AUTO_REVOKE_URGENT_EXECUTOR_HOT_ADDRESS } from '@revoke.cash/core/constants';
import { getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions, autoRevokeObservations } from '@revoke.cash/core/db/schema/auto-revoke';
import { getNativeTokenPriceUsd } from '@revoke.cash/core/prices';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { and, desc, eq, getTableColumns, gte, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import { type Address, formatEther, isAddressEqual } from 'viem';

const EXECUTOR_WALLETS: Array<{ lane: ExecutionLane; address: Address }> = [
  { lane: 'normal', address: AUTO_REVOKE_EXECUTOR_HOT_ADDRESS },
  { lane: 'urgent', address: AUTO_REVOKE_URGENT_EXECUTOR_HOT_ADDRESS },
];

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

          return { lane, address, chainId, nativeToken: getChainNativeToken(chainId), balance, balanceUsd };
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
}

// Submitted actions whose transaction has not settled within the expected confirmation window
export const getStuckSubmittedActions = async (): Promise<ProblemAction[]> => {
  const cutoff = new Date(Date.now() - 30 * MINUTE);

  const rows = await getDb()
    .select({ ...getTableColumns(autoRevokeActions), address: autoRevokeObservations.address })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId))
    .where(and(eq(autoRevokeActions.status, 'submitted'), lt(autoRevokeActions.submittedAt, cutoff)))
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
});
