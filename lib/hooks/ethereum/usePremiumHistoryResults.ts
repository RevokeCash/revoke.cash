import { useQueries } from '@tanstack/react-query';
import type { ApprovalHistoryEvent } from 'components/history/utils';
import type { ChainAllowanceData } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { getApprovalHistoryForChain } from 'lib/utils/approval-history';
import { getEventKey } from 'lib/utils/events';
import { HOUR } from 'lib/utils/time';
import { type CombinedQueryResult, combineQueryResults } from './combined-query-result';

export interface CombinedHistoryResult extends CombinedQueryResult<ApprovalHistoryEvent[]> {
  refetch: () => Promise<unknown>;
}

export const usePremiumHistoryResults = (chainData: ChainAllowanceData[]): CombinedHistoryResult[] => {
  return useQueries({
    queries: chainData.map((chain) => ({
      queryKey: ['approvalHistory', chain.chainId, chain.events.map(getEventKey)],
      queryFn: () => getApprovalHistoryForChain({ chainId: chain.chainId, events: chain.events }),
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
