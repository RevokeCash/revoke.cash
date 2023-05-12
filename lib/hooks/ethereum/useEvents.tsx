import { utils } from 'ethers';
import { ERC721Metadata } from 'lib/abis';
import { generatePatchedAllowanceEvents } from 'lib/utils/allowances';
import { useMemo } from 'react';
import { useBlockNumber } from './useBlockNumber';
import { useLogs } from './useLogs';
import { useOpenSeaProxyAddress } from './useOpenSeaProxyAddress';

export const useEvents = (address: string, chainId: number) => {
  const { openSeaProxyAddress, isLoading: isOpenSeaProxyAddressLoading } = useOpenSeaProxyAddress(address);
  const { data: blockNumber, isLoading: isBlockNumberLoading, error: blockNumberError } = useBlockNumber(chainId);

  const erc721Interface = new utils.Interface(ERC721Metadata);
  const addressTopic = address ? utils.hexZeroPad(address, 32) : undefined;

  const baseFilter = { fromBlock: 0, toBlock: blockNumber };

  const transferToTopics = addressTopic && [erc721Interface.getEventTopic('Transfer'), null, addressTopic];
  const transferFromTopics = addressTopic && [erc721Interface.getEventTopic('Transfer'), addressTopic];
  const approvalTopics = addressTopic && [erc721Interface.getEventTopic('Approval'), addressTopic];
  const approvalForAllTopics = addressTopic && [erc721Interface.getEventTopic('ApprovalForAll'), addressTopic];

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
  const isLoading = isOpenSeaProxyAddressLoading || isBlockNumberLoading || isEventsLoading;
  const error = blockNumberError || transferFromError || transferToError || approvalError || approvalForAllError;

  const events = useMemo(() => {
    if (!transferFrom || !transferTo || !approval || !approvalForAll) return undefined;
    if (error || isLoading) return undefined;
    return { transferFrom, transferTo, approval, approvalForAll };
  }, [transferFrom, transferTo, approval, approvalForAll]);

  return { events, isLoading, error };
};
