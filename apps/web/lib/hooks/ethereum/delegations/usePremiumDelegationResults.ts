import { createViemPublicClientForChain, ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { AggregateDelegatePlatform } from '@revoke.cash/core/delegations/AggregateDelegatePlatform';
import type { Delegation } from '@revoke.cash/core/delegations/DelegatePlatform';
import { isNullish } from '@revoke.cash/core/utils';
import { useQueries } from '@tanstack/react-query';
import analytics from 'lib/utils/analytics';
import type { Address, PublicClient } from 'viem';
import { type CombinedQueryResult, combineQueryResults } from '../combined-query-result';

const fetchDelegations = async (
  publicClient: PublicClient,
  chainId: number,
  address: Address,
): Promise<Delegation[]> => {
  if (!publicClient || !address) return [];

  const delegationPlatform = new AggregateDelegatePlatform(publicClient, chainId);
  return delegationPlatform.getDelegations(address);
};

export interface CombinedDelegationResult extends CombinedQueryResult<Delegation[]> {
  refetch: () => Promise<unknown>;
}

export const usePremiumDelegationResults = (address: Address | undefined): CombinedDelegationResult[] => {
  return useQueries({
    queries: ORDERED_CHAINS.map((chainId) => ({
      queryKey: getPremiumDelegationsQueryKey(address, chainId),
      queryFn: async () => {
        const publicClient = createViemPublicClientForChain(chainId);
        const delegations = await fetchDelegations(publicClient, chainId, address!);
        analytics.track('Fetched Delegations', { account: address, chainId });
        return delegations;
      },
      enabled: !isNullish(address),
      staleTime: Number.POSITIVE_INFINITY,
    })),
    combine: (results): CombinedDelegationResult[] =>
      results.map((r) => ({
        ...combineQueryResults([r])[0],
        refetch: r.refetch,
      })),
  });
};

export const getPremiumDelegationsQueryKey = (address: Address | undefined, chainId: number) =>
  ['delegations', address, chainId] as const;
