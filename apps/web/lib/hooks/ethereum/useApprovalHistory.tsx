import { getApprovalHistoryForChain } from '@revoke.cash/core/allowances/history';
import { getEventKey } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { HOUR } from '@revoke.cash/core/utils/time';
import { useQuery } from '@tanstack/react-query';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useAddress } from '../page-context/AddressIdentityContext';
import { useEvents } from './events/useEvents';
import { useAnnotateHistorySpenderData } from './useHistorySpenderData';

export const useApprovalHistory = () => {
  const { address } = useAddress();
  const { selectedChainId } = useAddressPageContext();
  const { events, isLoading: eventsLoading, error: eventsError } = useEvents(address, selectedChainId);

  const {
    data: approvalHistoryBase,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['approvalHistory', address, selectedChainId, events?.map(getEventKey)],
    queryFn: () => getApprovalHistoryForChain(events ?? []),
    enabled: !isNullish(events) && !eventsLoading,
    staleTime: 1 * HOUR,
  });
  const approvalHistory = useAnnotateHistorySpenderData(approvalHistoryBase);

  return {
    approvalHistory,
    isLoading: eventsLoading || historyLoading,
    error: eventsError || historyError,
  };
};
