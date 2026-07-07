import type { AllowanceType } from '@revoke.cash/core/allowances';
import { getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions, autoRevokeObservations } from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumSubscriptionAddresses } from '@revoke.cash/core/db/schema/premium';
import {
  getCompleteSpenderMetadata,
  type SpenderMetadataByAddress,
  serializeSpenderMetadata,
} from '@revoke.cash/core/indexer/spender-metadata';
import {
  getCompleteTokenMetadata,
  serializeTokenMetadata,
  type TokenMetadataByAddress,
} from '@revoke.cash/core/indexer/token-metadata';
import type { TokenMetadata } from '@revoke.cash/core/tokens';
import { deduplicateArray } from '@revoke.cash/core/utils';
import type { SpenderRiskData } from '@revoke.cash/core/whois';
import { and, desc, eq, getTableColumns, inArray, type SQL } from 'drizzle-orm';
import type { Address, Hash } from 'viem';
import type { Action, ActionErrorCode, ActionStatus } from './actions';
import type { Observation } from './evaluation/observations';

export interface AutoRevokeActivityItem {
  id: string;
  // Date is the most relevant moment for the row (confirmation time, broadcast time, or creation time).
  date: string;
  address: Address;
  chainId: number;
  allowanceType: AllowanceType;
  tokenAddress: Address;
  tokenMetadata: Pick<TokenMetadata, 'symbol' | 'icon'>;
  spenderAddress: Address;
  spenderData?: SpenderRiskData;
  triggerType: Observation['triggerType'];
  status: ActionStatus;
  errorCode: ActionErrorCode | null;
  nextRetryAt: string | null;
  costUsd: number | null;
  txHash: Hash | null;
}

export const getAddressActivity = (address: Address): Promise<AutoRevokeActivityItem[]> => {
  return queryActivity(eq(autoRevokeObservations.address, address));
};

export const getSubscriptionActivity = (subscriptionId: string): Promise<AutoRevokeActivityItem[]> => {
  return queryActivity(eq(premiumSubscriptionAddresses.subscriptionId, subscriptionId), true);
};

// We don't display activity that is not real or relevant, such as blocked_permission, blocked_rules and skipped.
const DISPLAYED_STATUSES: ActionStatus[] = ['queued', 'blocked_budget', 'submitted', 'succeeded', 'failed'];

const queryActivity = async (scopeFilter: SQL, joinMembership = false): Promise<AutoRevokeActivityItem[]> => {
  const baseQuery = getDb()
    .select({
      ...getTableColumns(autoRevokeActions),
      observation: getTableColumns(autoRevokeObservations),
    })
    .from(autoRevokeActions)
    .innerJoin(autoRevokeObservations, eq(autoRevokeObservations.id, autoRevokeActions.observationId));

  const scopedQuery = joinMembership
    ? baseQuery.innerJoin(
        premiumSubscriptionAddresses,
        eq(premiumSubscriptionAddresses.address, autoRevokeObservations.address),
      )
    : baseQuery;

  const rows = await scopedQuery
    .where(and(scopeFilter, inArray(autoRevokeActions.status, DISPLAYED_STATUSES)))
    .orderBy(desc(autoRevokeActions.createdAt), desc(autoRevokeActions.id));

  const actions = rows as Action[];
  const metadataByChain = await loadMetadataByChain(actions);

  return actions.map((action) => mapActivityItem(action, metadataByChain.get(action.observation.chainId)));
};

interface ChainMetadata {
  tokens: TokenMetadataByAddress;
  spenders: SpenderMetadataByAddress;
}

// Token and spender metadata are cached per chain by the indexer; the actions' tokens and spenders
// were all enriched during evaluation, so these lookups are cache reads in practice.
const loadMetadataByChain = async (actions: Action[]): Promise<Map<number, ChainMetadata>> => {
  const chainIds = deduplicateArray(actions.map((action) => action.observation.chainId));

  const entries = await Promise.all(
    chainIds.map(async (chainId) => {
      const observations = actions
        .filter((action) => action.observation.chainId === chainId)
        .map((action) => action.observation);

      const uniqueTokenAddresses = deduplicateArray(observations.map((observation) => observation.tokenAddress));
      const uniqueSpenderAddresses = deduplicateArray(observations.map((observation) => observation.spenderAddress));
      const [tokens, spenders] = await Promise.all([
        getCompleteTokenMetadata(chainId, uniqueTokenAddresses),
        getCompleteSpenderMetadata(chainId, uniqueSpenderAddresses),
      ]);

      return [chainId, { tokens, spenders }] as const;
    }),
  );

  return new Map(entries);
};

const mapActivityItem = (action: Action, metadata: ChainMetadata | undefined): AutoRevokeActivityItem => {
  const tokenMetadataRow = metadata?.tokens.get(action.observation.tokenAddress);
  const tokenMetadata = tokenMetadataRow ? serializeTokenMetadata(tokenMetadataRow) : undefined;

  return {
    id: action.id,
    date: (action.transaction?.minedAt ?? action.completedAt ?? action.submittedAt ?? action.createdAt).toISOString(),
    address: action.observation.address,
    chainId: action.observation.chainId,
    allowanceType: action.observation.allowanceType,
    tokenAddress: action.observation.tokenAddress,
    tokenMetadata: { symbol: tokenMetadata?.symbol ?? action.observation.tokenAddress, icon: tokenMetadata?.icon },
    spenderAddress: action.observation.spenderAddress,
    spenderData: serializeSpenderMetadata(metadata?.spenders.get(action.observation.spenderAddress)),
    triggerType: action.observation.triggerType,
    status: action.status,
    errorCode: action.errorCode,
    nextRetryAt: action.nextRetryAt?.toISOString() ?? null,
    costUsd: action.costUsd,
    txHash: action.transaction?.txHash ?? null,
  };
};
