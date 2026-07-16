import type { ChainStatus } from 'components/common/PremiumChainStatusSection';
import { useMemo } from 'react';
import { usePremiumAddressPageContext } from '../page-context/PremiumAddressPageContext';
import { useAnnotateHistorySpenderData } from './useHistorySpenderData';
import { type CombinedHistoryResult, usePremiumHistoryResults } from './usePremiumHistoryResults';

export type ChainHistoryLoadingStatus = 'loading' | 'success' | 'error';

export const usePremiumApprovalHistory = () => {
  const { chainData } = usePremiumAddressPageContext();

  const historyResults = usePremiumHistoryResults(chainData);

  const chainStatuses = useMemo<ChainStatus[]>(() => {
    return chainData.map((chain, index) => {
      const historyResult = historyResults[index];
      const status = getChainHistoryLoadingStatus(chain.status, historyResult, chain.events.length > 0);
      const error = historyResult?.error ?? chain.error ?? null;

      const refetch = () => {
        chain.refetch();
        historyResult?.refetch();
      };

      return { chainId: chain.chainId, status, error, isRefreshing: chain.isRefreshing, refetch };
    });
  }, [chainData, historyResults]);

  const approvalHistoryBase = useMemo(() => {
    return historyResults
      .map((result) => result.data)
      .flatMap((data) => data ?? [])
      .sort((a, b) => b.time.timestamp - a.time.timestamp);
  }, [historyResults]);
  const approvalHistory = useAnnotateHistorySpenderData(approvalHistoryBase);

  const isLoading = useMemo(() => {
    return chainData.some((chain) => chain.status === 'loading') || historyResults.some((result) => result.isLoading);
  }, [chainData, historyResults]);

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
  historyResult: CombinedHistoryResult,
  hasEvents: boolean,
): ChainHistoryLoadingStatus => {
  if (chainStatus === 'loading' || historyResult.isLoading) return 'loading';
  if (chainStatus === 'error' || historyResult.error) return 'error';
  if (historyResult.isSuccess || (chainStatus === 'success' && !hasEvents)) return 'success';
  return 'loading';
};
