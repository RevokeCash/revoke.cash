import { ERC721_ABI } from 'lib/abis';
import { addressToTopic, isNullish, sortTokenEventsChronologically } from 'lib/utils';
import {
  generatePatchedAllowanceEvents,
  parseApprovalForAllLog,
  parseApprovalLog,
  parsePermit2Log,
  parseTransferLog,
} from 'lib/utils/events';
import { useMemo } from 'react';
import { type Address, getAbiItem, toEventSelector } from 'viem';
import { useLogsFullBlockRange } from '../useLogsFullBlockRange';
import { useOpenSeaProxyAddress } from '../useOpenSeaProxyAddress';
import { usePermit2Events } from './usePermit2Events';

export const useEvents = (address: Address, chainId: number) => {
  const { openSeaProxyAddress, isLoading: isOpenSeaProxyAddressLoading } = useOpenSeaProxyAddress(address);

  const getErc721EventSelector = (eventName: 'Transfer' | 'Approval' | 'ApprovalForAll') => {
    return toEventSelector(getAbiItem({ abi: ERC721_ABI, name: eventName }));
  };

  const addressTopic = address ? addressToTopic(address) : undefined;
  const transferToFilter = addressTopic && { topics: [getErc721EventSelector('Transfer'), null, addressTopic] };
  const transferFromFilter = addressTopic && { topics: [getErc721EventSelector('Transfer'), addressTopic] };
  const approvalFilter = addressTopic && { topics: [getErc721EventSelector('Approval'), addressTopic] };
  const approvalForAllFilter = addressTopic && { topics: [getErc721EventSelector('ApprovalForAll'), addressTopic] };

  const {
    data: transferTo,
    isLoading: isTransferToLoading,
    error: transferToError,
  } = useLogsFullBlockRange('Transfer (to)', chainId, transferToFilter);

  const {
    data: transferFrom,
    isLoading: isTransferFromLoading,
    error: transferFromError,
  } = useLogsFullBlockRange('Transfer (from)', chainId, transferFromFilter);

  const {
    data: approval,
    isLoading: isApprovalLoading,
    error: approvalError,
  } = useLogsFullBlockRange('Approval', chainId, approvalFilter);

  const {
    data: approvalForAllUnpatched,
    isLoading: isApprovalForAllLoading,
    error: approvalForAllError,
  } = useLogsFullBlockRange('ApprovalForAll', chainId, approvalForAllFilter);

  const {
    events: permit2Approval,
    isLoading: isPermit2ApprovalLoading,
    error: permit2ApprovalError,
  } = usePermit2Events(address, chainId);

  // Manually patch the ApprovalForAll events
  const approvalForAll = useMemo(() => {
    if (!transferFrom || !transferTo || !approval || !approvalForAllUnpatched) return undefined;
    return [
      ...approvalForAllUnpatched,
      ...generatePatchedAllowanceEvents(address, openSeaProxyAddress ?? undefined, [
        ...approval,
        ...approvalForAllUnpatched,
        ...transferFrom,
        ...transferTo,
      ]),
    ];
  }, [transferFrom, transferTo, approval, approvalForAllUnpatched, openSeaProxyAddress]);

  const isEventsLoading = isTransferFromLoading || isTransferToLoading || isApprovalLoading || isApprovalForAllLoading;
  const isLoading = isOpenSeaProxyAddressLoading || isEventsLoading || isPermit2ApprovalLoading;
  const eventsError = transferFromError || transferToError || approvalError || approvalForAllError;
  const error = eventsError || permit2ApprovalError;

  const events = useMemo(() => {
    if (!transferFrom || !transferTo || !approval || !approvalForAll || !permit2Approval) return undefined;
    if (error || isLoading) return undefined;

    const parsedEvents = [
      // We put ApprovalForAll first to ensure that incorrect ERC721 contracts like CryptoStrikers are handled correctly
      ...approvalForAll.map((log) => parseApprovalForAllLog(log, chainId)),
      ...approval.map((log) => parseApprovalLog(log, chainId)),
      ...permit2Approval.map((log) => parsePermit2Log(log, chainId)),
      ...transferFrom.map((log) => parseTransferLog(log, chainId, address)),
      ...transferTo.map((log) => parseTransferLog(log, chainId, address)),
    ];

    // We sort the events in reverse chronological order to ensure that the most recent events are processed first
    return sortTokenEventsChronologically(parsedEvents.filter((event) => !isNullish(event))).reverse();
  }, [transferFrom, transferTo, approval, approvalForAll, permit2Approval]);

  return { events, isLoading, error };
};
