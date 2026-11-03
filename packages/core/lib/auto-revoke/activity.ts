import type { AllowanceType } from '@revoke.cash/core/allowances';
import { getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions, autoRevokeObservations } from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumSubscriptionAddresses } from '@revoke.cash/core/db/schema/premium';
import {
  getCompleteSpenderMetadata,
  type SpenderMetadataByAddress,
  serializeSpenderMetadata,
} from '@revoke.cash/core/indexer/spender-metadata';
import { getCompleteTokenMetadata, type TokenMetadataByAddress } from '@revoke.cash/core/indexer/token-metadata';
import type { TokenMetadata } from '@revoke.cash/core/tokens';
import { deduplicateArray } from '@revoke.cash/core/utils';
import type { SpenderData } from '@revoke.cash/core/whois';
import { and, desc, eq, getTableColumns, inArray, type SQL, sql } from 'drizzle-orm';
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
  tokenMetadata: Pick<TokenMetadata, 'symbol' | 'logoUrl'>;
  spenderAddress: Address;
  spenderData?: SpenderData;
  triggerType: Observation['triggerType'];
  status: ActionStatus;
  errorCode: ActionErrorCode | null;
  errorDetail: string | null;
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
// account_not_upgraded parks are surfaced on the permissions list instead of the activity feed.
const DISPLAYED_STATUSES: ActionStatus[] = ['queued', 'blocked_budget', 'submitted', 'succeeded', 'failed'];

// SQL equivalent of the `date` resolution in mapActivityItem, so ordering follows the displayed date.
export const activityDateSql = sql`coalesce((${autoRevokeActions.transaction} ->> 'minedAt')::timestamptz, ${autoRevokeActions.completedAt}, ${autoRevokeActions.submittedAt}, ${autoRevokeActions.createdAt})`;

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
    .orderBy(desc(activityDateSql), desc(autoRevokeActions.id));

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
export const loadMetadataByChain = async (actions: Action[]): Promise<Map<number, ChainMetadata>> => {
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

export const mapActivityItem = (action: Action, metadata: ChainMetadata | undefined): AutoRevokeActivityItem => {
  const tokenMetadata = metadata?.tokens.get(action.observation.tokenAddress);

  return {
    id: action.id,
    date: (action.transaction?.minedAt ?? action.completedAt ?? action.submittedAt ?? action.createdAt).toISOString(),
    address: action.observation.address,
    chainId: action.observation.chainId,
    allowanceType: action.observation.allowanceType,
    tokenAddress: action.observation.tokenAddress,
    tokenMetadata: {
      symbol: tokenMetadata?.symbol ?? action.observation.tokenAddress,
      logoUrl: tokenMetadata?.logoUrl ?? undefined,
    },
    spenderAddress: action.observation.spenderAddress,
    spenderData: serializeSpenderMetadata(metadata?.spenders.get(action.observation.spenderAddress)),
    triggerType: action.observation.triggerType,
    status: action.status,
    errorCode: action.errorCode,
    errorDetail: action.errorDetail,
    nextRetryAt: action.nextRetryAt?.toISOString() ?? null,
    costUsd: action.costUsd,
    txHash: action.transaction?.txHash ?? null,
  };
};
