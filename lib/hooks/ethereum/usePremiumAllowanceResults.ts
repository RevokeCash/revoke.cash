import { useQueries } from '@tanstack/react-query';
import { isNullish } from 'lib/utils';
import { getAllowancesFromEvents, type TokenAllowanceData } from 'lib/utils/allowances';
import analytics from 'lib/utils/analytics';
import { createViemPublicClientForChain, ORDERED_CHAINS } from 'lib/utils/chains';
import { getEventKey, type TokenEvent } from 'lib/utils/events';
import type { Address } from 'viem';
import { type CombinedQueryResult, combineQueryResults } from './combined-query-result';

export const usePremiumAllowanceResults = (
  address: Address,
  eventResults: CombinedQueryResult<TokenEvent[]>[],
): CombinedQueryResult<TokenAllowanceData[]>[] => {
  return useQueries({
    queries: ORDERED_CHAINS.map((chainId, index) => {
      const events = eventResults[index]?.data;
      return {
        queryKey: ['allowances', address, chainId, events?.map(getEventKey)],
        queryFn: async () => {
          const publicClient = createViemPublicClientForChain(chainId);
          const allowances = await getAllowancesFromEvents(address, events!, publicClient, chainId);
          analytics.track('Fetched Allowances', { account: address, chainId });
          return allowances;
        },
        enabled: !isNullish(address) && !isNullish(chainId) && !isNullish(events),
        staleTime: Number.POSITIVE_INFINITY,
      };
    }),
    combine: combineQueryResults,
  });
};
