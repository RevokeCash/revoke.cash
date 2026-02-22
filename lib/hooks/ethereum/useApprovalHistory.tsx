import { useQuery } from '@tanstack/react-query';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { isNullish } from 'lib/utils';
import { getEventKey } from 'lib/utils/events';
import { HOUR } from 'lib/utils/time';
import { usePublicClient } from 'wagmi';
import { getApprovalHistoryForChain } from '../../utils/approval-history';
import { useAddress } from '../page-context/AddressIdentityContext';
import { useEvents } from './events/useEvents';
import { useHistorySpenderData } from './useHistorySpenderData';

export const useApprovalHistory = () => {
  const { address } = useAddress();
  const { selectedChainId } = useAddressPageContext();
  const { events, isLoading: eventsLoading, error: eventsError } = useEvents(address, selectedChainId);
  const publicClient = usePublicClient({ chainId: selectedChainId });

  const {
    data: approvalHistoryBase,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['approvalHistory', address, selectedChainId, events?.map(getEventKey)],
    queryFn: () =>
      getApprovalHistoryForChain({ chainId: selectedChainId, events: events ?? [], publicClient: publicClient! }),
    enabled: !isNullish(events) && !eventsLoading && !isNullish(publicClient),
    staleTime: 1 * HOUR,
  });
  const approvalHistory = useHistorySpenderData(approvalHistoryBase);

  return {
    approvalHistory,
    isLoading: eventsLoading || historyLoading,
    error: eventsError || historyError,
  };
};
