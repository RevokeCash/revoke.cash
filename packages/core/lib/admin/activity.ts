import { laneForSigner } from '@revoke.cash/core/admin/executor';
import type { Action, ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import {
  type AutoRevokeActivityItem,
  loadMetadataByChain,
  mapActivityItem,
} from '@revoke.cash/core/auto-revoke/activity';
import type { ExecutionLane } from '@revoke.cash/core/auto-revoke/execution/signer';
import { getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions, autoRevokeObservations } from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumSubscriptionAddresses } from '@revoke.cash/core/db/schema/premium';
import { and, count, desc, eq, getTableColumns, inArray } from 'drizzle-orm';
import type { Address, Hash } from 'viem';

// The admin activity feed includes the statuses and diagnostic fields the user-facing feed hides
export interface AdminActivityItem extends AutoRevokeActivityItem {
  signerAddress: Address | null;
  lane: ExecutionLane | null;
  nonce: number | null;
  billedSubscriptionId: string | null;
  createdAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  costDeferredAt: string | null;
  estimatedCostUsd: number | null;
  txHashes: Hash[];
}

interface AdminActivityFilters {
  address?: Address;
  subscriptionId?: string;
  chainIds?: number[];
  statuses?: ActionStatus[];
  page: number;
  pageSize: number;
}

interface AdminActivityPage {
  items: AdminActivityItem[];
  totalCount: number;
}

export const getAdminActivity = async (filters: AdminActivityFilters): Promise<AdminActivityPage> => {
  const conditions = [
    filters.address ? eq(autoRevokeObservations.address, filters.address) : undefined,
    filters.subscriptionId
      ? inArray(
          autoRevokeObservations.address,
          getDb()
            .select({ address: premiumSubscriptionAddresses.address })
            .from(premiumSubscriptionAddresses)
            .where(eq(premiumSubscriptionAddresses.subscriptionId, filters.subscriptionId)),
        )
      : undefined,
    filters.chainIds && filters.chainIds.length > 0
      ? inArray(autoRevokeObservations.chainId, filters.chainIds)
      : undefined,
    filters.statuses && filters.statuses.length > 0 ? inArray(autoRevokeActions.status, filters.statuses) : undefined,
  ];

  const [rows, [{ totalCount }]] = await Promise.all([
    baseActivityQuery()
      .where(and(...conditions))
      .orderBy(desc(autoRevokeActions.createdAt), desc(autoRevokeActions.id))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize),
    baseActivityCountQuery().where(and(...conditions)),
  ]);

  const actions = rows as Action[];
  const metadataByChain = await loadMetadataByChain(actions);

  const items = actions.map((action): AdminActivityItem => {
    const item = mapActivityItem(action, metadataByChain.get(action.observation.chainId));

    return {
      ...item,
      signerAddress: action.signerAddress,
      lane: laneForSigner(action.signerAddress),
      nonce: action.nonce,
      billedSubscriptionId: action.billedSubscriptionId,
      createdAt: action.createdAt.toISOString(),
      submittedAt: action.submittedAt?.toISOString() ?? null,
      completedAt: action.completedAt?.toISOString() ?? null,
      costDeferredAt: action.costDeferredAt?.toISOString() ?? null,
      estimatedCostUsd: action.transaction?.estimatedCostUsd ?? null,
      txHashes: action.transaction?.txHashes ?? [],
    };
  });

  return { items, totalCount };
};

const baseActivityQuery = () =>
  getDb()
    .select({
      ...getTableColumns(autoRevokeActions),
      observation: getTableColumns(autoRevokeObservations),
    })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId));

const baseActivityCountQuery = () =>
  getDb()
    .select({ totalCount: count() })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId));
