import { getApprovalHistoryForChain } from '@revoke.cash/core/allowances/history';
import { type ApprovalTokenEvent, type Enriched, getEventKey } from '@revoke.cash/core/events';
import { HOUR } from '@revoke.cash/core/utils/time';
import { useQueries } from '@tanstack/react-query';
import type { ChainAllowanceData } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { type CombinedQueryResult, combineQueryResults } from './combined-query-result';

export interface CombinedHistoryResult extends CombinedQueryResult<Enriched<ApprovalTokenEvent>[]> {
  refetch: () => Promise<unknown>;
}

export const usePremiumHistoryResults = (chainData: ChainAllowanceData[]): CombinedHistoryResult[] => {
  return useQueries({
    queries: chainData.map((chain) => ({
      queryKey: ['approvalHistory', chain.chainId, chain.events.map(getEventKey)],
      queryFn: () => getApprovalHistoryForChain(chain.events),
      enabled: chain.status !== 'loading' && chain.events.length > 0,
      staleTime: 1 * HOUR,
    })),
    combine: (results): CombinedHistoryResult[] =>
      results.map((r) => ({
        ...combineQueryResults([r])[0],
        refetch: r.refetch,
      })),
  });
};
