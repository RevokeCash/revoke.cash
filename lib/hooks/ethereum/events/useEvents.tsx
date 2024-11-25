import { ERC721_ABI } from 'lib/abis';
import { addressToTopic, sortTokenEventsChronologically } from 'lib/utils';
import { generatePatchedAllowanceEvents } from 'lib/utils/allowances';
import {
  parseApprovalForAllLog,
  parseApprovalLog,
  parseErc1155TransferLog,
  parsePermit2Log,
  parseTransferLog,
  TokenEvent,
} from 'lib/utils/events';
import { useMemo } from 'react';
import { Address, getAbiItem, toEventSelector } from 'viem';
import { useLogsFullBlockRange } from '../useLogsFullBlockRange';
import { useOpenSeaProxyAddress } from '../useOpenSeaProxyAddress';
import { useErc1155TransferEvents } from './useErc1155TransferEvents';
import { usePermit2Events } from './usePermit2Events';

export const useEvents = (address: Address, chainId: number) => {
  const { openSeaProxyAddress, isLoading: isOpenSeaProxyAddressLoading } = useOpenSeaProxyAddress(address);

  const getErc721EventSelector = (eventName: 'Transfer' | 'Approval' | 'ApprovalForAll') => {
    return toEventSelector(getAbiItem({ abi: ERC721_ABI, name: eventName }));
  };

  const addressTopic = address ? addressToTopic(address) : undefined;
  const transferToTopics = addressTopic && [getErc721EventSelector('Transfer'), null, addressTopic];
  const transferFromTopics = addressTopic && [getErc721EventSelector('Transfer'), addressTopic];
  const approvalTopics = addressTopic && [getErc721EventSelector('Approval'), addressTopic];
  const approvalForAllTopics = addressTopic && [getErc721EventSelector('ApprovalForAll'), addressTopic];

  const {
    data: transferTo,
    isLoading: isTransferToLoading,
    error: transferToError,
  } = useLogsFullBlockRange('Transfer (to)', chainId, { topics: transferToTopics });

  const {
    data: transferFrom,
    isLoading: isTransferFromLoading,
    error: transferFromError,
  } = useLogsFullBlockRange('Transfer (from)', chainId, { topics: transferFromTopics });

  const {
    data: approval,
    isLoading: isApprovalLoading,
    error: approvalError,
  } = useLogsFullBlockRange('Approval', chainId, { topics: approvalTopics });

  const {
    data: approvalForAllUnpatched,
    isLoading: isApprovalForAllLoading,
    error: approvalForAllError,
  } = useLogsFullBlockRange('ApprovalForAll', chainId, { topics: approvalForAllTopics });

  const {
    events: permit2Approval,
    isLoading: isPermit2ApprovalLoading,
    error: permit2ApprovalError,
  } = usePermit2Events(address, chainId);

  const {
    events: erc1155Transfer,
    isLoading: isErc1155TransferLoading,
    error: erc1155TransferError,
  } = useErc1155TransferEvents(address, chainId);

  // Manually patch the ApprovalForAll events
  const approvalForAll = useMemo(() => {
    if (!transferFrom || !transferTo || !approval || !approvalForAllUnpatched) return undefined;
    return [
      ...approvalForAllUnpatched,
      ...generatePatchedAllowanceEvents(address, openSeaProxyAddress, [
        ...approval,
        ...approvalForAllUnpatched,
        ...transferFrom,
        ...transferTo,
      ]),
    ];
  }, [transferFrom, transferTo, approval, approvalForAllUnpatched, openSeaProxyAddress]);

  const isEventsLoading = isTransferFromLoading || isTransferToLoading || isApprovalLoading || isApprovalForAllLoading;
  const isLoading =
    isOpenSeaProxyAddressLoading || isEventsLoading || isPermit2ApprovalLoading || isErc1155TransferLoading;
  const eventsError = transferFromError || transferToError || approvalError || approvalForAllError;
  const error = eventsError || permit2ApprovalError || erc1155TransferError;

  const events = useMemo(() => {
    if (!transferFrom || !transferTo || !approval || !approvalForAll || !permit2Approval || !erc1155Transfer) {
      return undefined;
    }

    if (error || isLoading) return undefined;

    const parsedEvents = [
      // We put ApprovalForAll first to ensure that incorrect ERC721 contracts like CryptoStrikers are handled correctly
      ...approvalForAll.map((log) => parseApprovalForAllLog(log, chainId)),
      ...approval.map((log) => parseApprovalLog(log, chainId)),
      ...permit2Approval.map((log) => parsePermit2Log(log, chainId)),
      ...erc1155Transfer.map((log) => parseErc1155TransferLog(log, chainId, address)),
      ...transferFrom.map((log) => parseTransferLog(log, chainId, address)),
      ...transferTo.map((log) => parseTransferLog(log, chainId, address)),
    ];

    // We sort the events in reverse chronological order to ensure that the most recent events are processed first
    return sortTokenEventsChronologically(parsedEvents.filter(Boolean) as TokenEvent[]).reverse();
  }, [transferFrom, transferTo, approval, approvalForAll, permit2Approval, erc1155Transfer]);

  return { events, isLoading, error };
};
