import { AUTO_REVOKE_SUPPORTED_CHAINS, isAutoRevokeSupportedChain } from '@revoke.cash/core/auto-revoke/config';
import { createViemPublicClientForChain, getChainCoingeckoAssetPlatformId } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerAllowanceState, indexerAllowances } from '@revoke.cash/core/db/schema/indexer';
import type { Exploit } from '@revoke.cash/core/exploits';
import { loadEnrichedAddressAllowances } from '@revoke.cash/core/indexer/allowances-read';
import { isAllowanceCacheFresh } from '@revoke.cash/core/indexer/cache-state';
import { addSpenderRiskFactor } from '@revoke.cash/core/indexer/spender-metadata';
import { activeSubscriptionsQuery } from '@revoke.cash/core/premium/subscriptions';
import { getNftFloorPricesUsd, getTokenPricesUsd } from '@revoke.cash/core/prices';
import { getTokenBalances, isErc721, type TokenBalance, type TokenReference } from '@revoke.cash/core/tokens';
import type { AddressOnChain } from '@revoke.cash/core/types';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { withFallback } from '@revoke.cash/core/utils/promises';
import { and, asc, eq, exists, inArray, isNotNull, isNull, lt, or } from 'drizzle-orm';
import { type Address, getAddress } from 'viem';
import { findBillingSubscriptionIds } from '../execution/budget';
import { createObservations, type Observation, type ObservationCandidate } from './observations';
import { getEffectiveRules, getMatchedTriggers, getPrimaryTrigger } from './rules';

export interface EvaluationResult {
  skipped: boolean;
  observations: Observation[];
  reason?: SkipReason;
}

type SkipReason =
  | 'unsupported_chain'
  | 'allowance_cache_not_fresh'
  | 'no_active_ultimate_subscription'
  | 'no_allowances'
  | 'no_matches'
  | 'no_observations';

const skipWithReason = (reason: SkipReason): EvaluationResult => ({
  skipped: true,
  observations: [],
  reason,
});

export const findPendingEvaluations = async (limit: number): Promise<AddressOnChain[]> => {
  const db = getDb();

  return db
    .select({ address: indexerAllowanceState.address, chainId: indexerAllowanceState.chainId })
    .from(indexerAllowanceState)
    .where(
      and(
        inArray(indexerAllowanceState.chainId, AUTO_REVOKE_SUPPORTED_CHAINS),
        isNotNull(indexerAllowanceState.computedAt),
        or(
          isNull(indexerAllowanceState.lastEvaluatedAt),
          lt(indexerAllowanceState.lastEvaluatedAt, indexerAllowanceState.computedAt),
        ),
        exists(activeSubscriptionsQuery(db, indexerAllowanceState.address, 'ultimate')),
      ),
    )
    .orderBy(asc(indexerAllowanceState.computedAt))
    .limit(limit);
};

export const evaluateAddress = async (address: Address, chainId: number): Promise<EvaluationResult> => {
  if (!isAutoRevokeSupportedChain(chainId)) return skipWithReason('unsupported_chain');

  const computedAtBeforeEvaluation = await readAllowancesComputedAt(address, chainId);

  const result = await performEvaluation(address, chainId);

  if (!isNullish(computedAtBeforeEvaluation)) {
    await recordLastEvaluatedAt(address, chainId, computedAtBeforeEvaluation);
  }

  return result;
};

const performEvaluation = async (address: Address, chainId: number): Promise<EvaluationResult> => {
  const cacheFresh = await isAllowanceCacheFresh(address, chainId);
  if (!cacheFresh) return skipWithReason('allowance_cache_not_fresh');

  const billingSubscriptionIds = await findBillingSubscriptionIds(getDb(), address);
  if (billingSubscriptionIds.length === 0) return skipWithReason('no_active_ultimate_subscription');

  const allowances = await loadEnrichedAddressAllowances(address, chainId);
  if (allowances.length === 0) return skipWithReason('no_allowances');

  const ruleSnapshot = await getEffectiveRules(address);

  const candidates = allowances
    .map((allowance) => {
      const matchedTriggers = getMatchedTriggers(allowance, ruleSnapshot.rules);
      if (matchedTriggers.length === 0) return null;

      return {
        triggerType: getPrimaryTrigger(matchedTriggers),
        triggerDetails: { matchedTriggers },
        ruleSnapshot,
        allowance,
      };
    })
    .filter((candidate) => !isNullish(candidate));

  if (candidates.length === 0) return skipWithReason('no_matches');

  const candidatesWithValue = await addBalancesAndPrices(address, chainId, candidates);

  const observations = await createObservations(candidatesWithValue);
  if (observations.length === 0) return skipWithReason('no_observations');

  return { skipped: false, observations };
};

// Balances and prices only decide the revoke order, so a failed lookup never blocks the evaluation
const addBalancesAndPrices = async (
  address: Address,
  chainId: number,
  candidates: ObservationCandidate[],
): Promise<ObservationCandidate[]> => {
  const tokens = deduplicateArray(
    candidates.map((candidate) => candidate.allowance.token),
    (token) => token.address,
  );

  const publicClient = createViemPublicClientForChain(chainId);
  const tokenAddresses = tokens.map((token) => token.address);
  const balancesByToken = await getTokenBalances(publicClient, address, tokenAddresses);

  const heldTokens = tokens.filter((token) => isHeldBalance(balancesByToken[token.address]));
  const pricesByToken = await getPricesByToken(chainId, heldTokens);

  return candidates.map((candidate) => {
    const { allowance } = candidate;
    const balance = balancesByToken[allowance.token.address];
    const price = pricesByToken[getAddress(allowance.token.address)] ?? null;

    return { ...candidate, allowance: { ...allowance, balance, metadata: { ...allowance.metadata, price } } };
  });
};

const getPricesByToken = async (chainId: number, tokens: TokenReference[]): Promise<Record<Address, number | null>> => {
  const erc20Addresses = tokens.filter((token) => !isErc721(token)).map((token) => token.address);

  // NFT floor prices are only available on chains where CoinGecko tracks NFT collections
  const hasNftFloorPrices = Boolean(getChainCoingeckoAssetPlatformId(chainId));
  const erc721Addresses = hasNftFloorPrices ? tokens.filter(isErc721).map((token) => token.address) : [];

  const [tokenPrices, nftFloorPrices] = await Promise.all([
    withFallback(getTokenPricesUsd(chainId, erc20Addresses), {}),
    withFallback(getNftFloorPricesUsd(chainId, erc721Addresses), {}),
  ]);

  return { ...tokenPrices, ...nftFloorPrices };
};

const isHeldBalance = (balance?: TokenBalance): boolean => typeof balance === 'bigint' && balance > 0n;

const readAllowancesComputedAt = async (address: Address, chainId: number): Promise<Date | null> => {
  const allowanceState = await getDb().query.indexerAllowanceState.findFirst({
    where: and(eq(indexerAllowanceState.address, address), eq(indexerAllowanceState.chainId, chainId)),
    columns: { computedAt: true },
  });

  return allowanceState?.computedAt ?? null;
};

const recordLastEvaluatedAt = async (address: Address, chainId: number, computedAt: Date): Promise<void> => {
  await getDb()
    .update(indexerAllowanceState)
    .set({ lastEvaluatedAt: computedAt })
    .where(
      and(
        eq(indexerAllowanceState.address, address),
        eq(indexerAllowanceState.chainId, chainId),
        or(isNull(indexerAllowanceState.lastEvaluatedAt), lt(indexerAllowanceState.lastEvaluatedAt, computedAt)),
      ),
    );
};

// Record the exploit as a spender risk factor so the normal evaluation detects it like any other
// risk, then return every address with allowances to the exploit's spenders. The caller pushes each
// one back through the indexing pipeline so it is re-evaluated against freshly indexed allowances.
export const prepareExploitEvaluation = async (exploit: Exploit): Promise<AddressOnChain[]> => {
  if (exploit.addresses.length === 0) return [];

  await addSpenderRiskFactor(exploit.addresses, { type: 'exploit', source: 'whois', data: exploit.name });

  const affectedAddresses = getDb()
    .selectDistinct({ address: indexerAllowances.address, chainId: indexerAllowances.chainId })
    .from(indexerAllowances)
    .where(
      or(
        ...exploit.addresses.map(({ chainId, address }) =>
          and(eq(indexerAllowances.chainId, chainId), eq(indexerAllowances.spenderAddress, address)),
        ),
      ),
    );

  return affectedAddresses;
};
