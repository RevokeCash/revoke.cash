import { type UseQueryResult, useQueries } from '@tanstack/react-query';
import type { ApprovalHistoryEvent } from 'components/history/utils';
import { getTokenEvents } from 'lib/chains/events';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { isNullish } from 'lib/utils';
import { ORDERED_CHAINS } from 'lib/utils/chains';
import { getEventKey, type TokenEvent } from 'lib/utils/events';
import { HOUR } from 'lib/utils/time';
import { useMemo } from 'react';
import { getApprovalHistoryForChain } from '../../utils/approval-history';
import { useHistorySpenderData } from './useHistorySpenderData';

export type ChainHistoryLoadingStatus = 'loading' | 'success' | 'error';

export interface ChainHistoryStatus {
  chainId: number;
  status: ChainHistoryLoadingStatus;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const usePremiumApprovalHistory = () => {
  const { address } = useAddress();

  const eventQueries = useQueries({
    queries: ORDERED_CHAINS.map((chainId) => ({
      queryKey: ['events', address, chainId],
      queryFn: () => getTokenEvents(chainId, address),
      enabled: !isNullish(address),
      staleTime: Number.POSITIVE_INFINITY,
    })),
  });

  const historyQueries = useQueries({
    queries: ORDERED_CHAINS.map((chainId, index) => {
      const events = eventQueries[index]?.data;

      return {
        queryKey: ['approvalHistory', address, chainId, events?.map(getEventKey)],
        queryFn: () => getApprovalHistoryForChain({ chainId, events: events! }),
        enabled: !isNullish(events) && !eventQueries[index]?.isLoading,
        staleTime: 1 * HOUR,
      };
    }),
  });

  const chainStatuses = useMemo<ChainHistoryStatus[]>(() => {
    return ORDERED_CHAINS.map((chainId, index) => {
      const eventQuery = eventQueries[index];
      const historyQuery = historyQueries[index];
      const status = getChainHistoryLoadingStatus(eventQuery, historyQuery);
      const error = (historyQuery?.error ?? eventQuery?.error ?? null) as Error | null;

      const refetch = async () => {
        await eventQuery?.refetch();
        await historyQuery?.refetch();
      };

      return { chainId, status, error, refetch };
    });
  }, [eventQueries, historyQueries]);

  const approvalHistoryBase = useMemo(() => {
    return historyQueries
      .map((query) => query.data)
      .flatMap((queryData) => queryData ?? [])
      .sort((a, b) => (b.time.timestamp ?? 0) - (a.time.timestamp ?? 0));
  }, [historyQueries]);
  const approvalHistory = useHistorySpenderData(approvalHistoryBase);

  const isLoading = useMemo(() => {
    return eventQueries.some((query) => query.isLoading) || historyQueries.some((query) => query.isLoading);
  }, [eventQueries, historyQueries]);

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
  eventQuery: UseQueryResult<TokenEvent[], Error>,
  historyQuery: UseQueryResult<ApprovalHistoryEvent[], Error>,
): ChainHistoryLoadingStatus => {
  if (eventQuery.isLoading || historyQuery.isLoading) return 'loading';
  if (eventQuery.error || historyQuery.error) return 'error';
  if (historyQuery.isSuccess) return 'success';
  return 'loading';
};
