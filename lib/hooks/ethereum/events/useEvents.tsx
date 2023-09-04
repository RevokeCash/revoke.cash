import { addressToTopic } from 'lib/utils';
import { generatePatchedAllowanceEvents } from 'lib/utils/allowances';
import { useEffect, useMemo } from 'react';
import { useBlockNumber } from '../useBlockNumber';
import { useLogs } from '../useLogs';
import { useOpenSeaProxyAddress } from '../useOpenSeaProxyAddress';
import { usePermit2Events } from './usePermit2Events';
import { Address, getAbiItem, getEventSelector } from 'viem';
import { ERC721_ABI } from 'lib/abis';

export const useEvents = (address: Address, chainId: number) => {
  const { openSeaProxyAddress, isLoading: isOpenSeaProxyAddressLoading } = useOpenSeaProxyAddress(address);
  const { data: blockNumber, isLoading: isBlockNumberLoading, error: blockNumberError } = useBlockNumber(chainId);

  const getErc721EventSelector = (eventName: 'Transfer' | 'Approval' | 'ApprovalForAll') => {
    return getEventSelector(getAbiItem({ abi: ERC721_ABI, name: eventName }));
  };

  const addressTopic = address ? addressToTopic(address) : undefined;
  const transferToTopics = addressTopic && [getErc721EventSelector('Transfer'), null, addressTopic];
  const transferFromTopics = addressTopic && [getErc721EventSelector('Transfer'), addressTopic];
  const approvalTopics = addressTopic && [getErc721EventSelector('Approval'), addressTopic];
  const approvalForAllTopics = addressTopic && [getErc721EventSelector('ApprovalForAll'), addressTopic];

  const baseFilter = { fromBlock: 0, toBlock: blockNumber };

  const {
    data: transferTo,
    isLoading: isTransferToLoading,
    error: transferToError,
  } = useLogs('Transfer (to)', chainId, { ...baseFilter, topics: transferToTopics });

  const {
    data: transferFrom,
    isLoading: isTransferFromLoading,
    error: transferFromError,
  } = useLogs('Transfer (from)', chainId, { ...baseFilter, topics: transferFromTopics });

  const {
    data: approval,
    isLoading: isApprovalLoading,
    error: approvalError,
  } = useLogs('Approval', chainId, { ...baseFilter, topics: approvalTopics });

  const {
    data: approvalForAllUnpatched,
    isLoading: isApprovalForAllLoading,
    error: approvalForAllError,
  } = useLogs('ApprovalForAll', chainId, { ...baseFilter, topics: approvalForAllTopics });

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
      ...generatePatchedAllowanceEvents(address, openSeaProxyAddress, [
        ...approval,
        ...approvalForAllUnpatched,
        ...transferFrom,
        ...transferTo,
      ]),
    ];
  }, [transferFrom, transferTo, approval, approvalForAllUnpatched, openSeaProxyAddress]);

  const isEventsLoading = isTransferFromLoading || isTransferToLoading || isApprovalLoading || isApprovalForAllLoading;
  const isLoading = isOpenSeaProxyAddressLoading || isBlockNumberLoading || isEventsLoading || isPermit2ApprovalLoading;
  const eventsError = transferFromError || transferToError || approvalError || approvalForAllError;
  const error = blockNumberError || eventsError || permit2ApprovalError;

  const events = useMemo(() => {
    if (!transferFrom || !transferTo || !approval || !approvalForAll || !permit2Approval) return undefined;
    if (error || isLoading) return undefined;
    return { transferFrom, transferTo, approval, approvalForAll, permit2Approval };
  }, [transferFrom, transferTo, approval, approvalForAll, permit2Approval]);

  return { events, isLoading, error };
};
