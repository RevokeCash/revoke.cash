import { useQueries } from '@tanstack/react-query';
import type { ChainStatus } from 'components/common/PremiumChainStatusSection';
import { getEventKey } from 'lib/utils/events';
import { HOUR } from 'lib/utils/time';
import { useMemo } from 'react';
import { getApprovalHistoryForChain } from '../../utils/approval-history';
import { usePremiumAddressPageContext } from '../page-context/PremiumAddressPageContext';
import { useHistorySpenderData } from './useHistorySpenderData';

export type ChainHistoryLoadingStatus = 'loading' | 'success' | 'error';

export const usePremiumApprovalHistory = () => {
  const { chainData } = usePremiumAddressPageContext();

  const historyQueries = useQueries({
    queries: chainData.map((chain) => ({
      queryKey: ['approvalHistory', chain.chainId, chain.events.map(getEventKey)],
      queryFn: () => getApprovalHistoryForChain({ chainId: chain.chainId, events: chain.events }),
      enabled: chain.status !== 'loading' && chain.events.length > 0,
      staleTime: 1 * HOUR,
    })),
  });

  const chainStatuses = useMemo<ChainStatus[]>(() => {
    return chainData.map((chain, index) => {
      const historyQuery = historyQueries[index];
      const status = getChainHistoryLoadingStatus(chain.status, historyQuery);
      const error = (historyQuery?.error ?? chain.error ?? null) as Error | null;

      const refetch = () => {
        chain.refetch();
        historyQuery?.refetch();
      };

      return { chainId: chain.chainId, status, error, refetch };
    });
  }, [chainData, historyQueries]);

  const approvalHistoryBase = useMemo(() => {
    return historyQueries
      .map((query) => query.data)
      .flatMap((queryData) => queryData ?? [])
      .sort((a, b) => (b.time.timestamp ?? 0) - (a.time.timestamp ?? 0));
  }, [historyQueries]);
  const approvalHistory = useHistorySpenderData(approvalHistoryBase);

  const isLoading = useMemo(() => {
    return chainData.some((chain) => chain.status === 'loading') || historyQueries.some((query) => query.isLoading);
  }, [chainData, historyQueries]);

  const error = useMemo(() => {
    const allChainsFailed = chainStatuses.every((chain) => chain.status === 'error');
    if (!allChainsFailed) return undefined;

    return chainStatuses.find((chain) => chain.error)?.error ?? undefined;
  }, [chainStatuses]);

  return {
    approvalHistory,
    chainStatuses,
    isLoading,
    error,
  };
};

const getChainHistoryLoadingStatus = (
  chainStatus: 'loading' | 'success' | 'error',
  historyQuery: { isLoading: boolean; error: Error | null; isSuccess: boolean },
): ChainHistoryLoadingStatus => {
  if (chainStatus === 'loading' || historyQuery.isLoading) return 'loading';
  if (chainStatus === 'error' || historyQuery.error) return 'error';
  if (historyQuery.isSuccess) return 'success';
  return 'loading';
};
