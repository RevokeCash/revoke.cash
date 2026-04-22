import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { getTokenEvents } from '@revoke.cash/core/chains/events';
import type { EnrichedTokenEvent } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { useQueries } from '@tanstack/react-query';
import { getLogsProvider } from 'lib/providers';
import type { Address } from 'viem';
import { type CombinedQueryResult, combineQueryResults } from './combined-query-result';

export const usePremiumEventResults = (address: Address): CombinedQueryResult<EnrichedTokenEvent[]>[] => {
  return useQueries({
    queries: ORDERED_CHAINS.map((chainId) => ({
      queryKey: ['events', address, chainId],
      queryFn: async () => {
        const { events } = await getTokenEvents(chainId, address, getLogsProvider(chainId));
        return events;
      },
      enabled: !isNullish(address),
      staleTime: Number.POSITIVE_INFINITY,
    })),
    combine: combineQueryResults,
  });
};
