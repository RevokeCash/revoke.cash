import { getAllowancesFromEvents, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { createViemPublicClientForChain, ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { type EnrichedTokenEvent, getEventKey } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { useQueries } from '@tanstack/react-query';
import analytics from 'lib/utils/analytics';
import type { Address } from 'viem';
import { type CombinedQueryResult, combineQueryResults } from './combined-query-result';

export const usePremiumAllowanceResults = (
  address: Address,
  eventResults: CombinedQueryResult<EnrichedTokenEvent[]>[],
  timeMachineBlocks?: Record<number, number | null | undefined>,
  referenceTime?: number,
): CombinedQueryResult<TokenAllowanceData[]>[] => {
  return useQueries({
    queries: ORDERED_CHAINS.map((chainId, index) => {
      const events = eventResults[index]?.data;
      const targetBlock = timeMachineBlocks?.[chainId];
      return {
        queryKey: [
          'allowances',
          address,
          chainId,
          Array.isArray(events) ? events.map(getEventKey) : undefined,
          targetBlock ?? 'latest',
        ],
        queryFn: async () => {
          const blockNumber = targetBlock != null ? BigInt(targetBlock) : undefined;
          const publicClient = createViemPublicClientForChain(chainId, undefined, blockNumber);
          const allowances = await getAllowancesFromEvents(
            address,
            events!,
            publicClient,
            chainId,
            blockNumber,
            referenceTime,
          );
          analytics.track('Fetched Allowances', { account: address, chainId });
          return allowances;
        },
        enabled: !isNullish(address) && !isNullish(chainId) && Array.isArray(events),
        staleTime: Number.POSITIVE_INFINITY,
      };
    }),
    combine: combineQueryResults,
  });
};
