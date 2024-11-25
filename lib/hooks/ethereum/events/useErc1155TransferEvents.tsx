import { ERC1155_ABI } from 'lib/abis';
import { addressToTopic } from 'lib/utils';
import { useMemo } from 'react';
import { Address, getAbiItem, toEventSelector } from 'viem';
import { useLogsFullBlockRange } from '../useLogsFullBlockRange';

export const useErc1155TransferEvents = (address: Address, chainId: number) => {
  const getErc1155EventSelector = (eventName: 'TransferSingle' | 'TransferBatch') => {
    return toEventSelector(getAbiItem({ abi: ERC1155_ABI, name: eventName }));
  };

  const addressTopic = address ? addressToTopic(address) : undefined;

  const transferSingleToTopics = addressTopic && [getErc1155EventSelector('TransferSingle'), null, null, addressTopic];
  const transferSingleFromTopics = addressTopic && [getErc1155EventSelector('TransferSingle'), null, addressTopic];
  const transferBatchToTopics = addressTopic && [getErc1155EventSelector('TransferBatch'), null, null, addressTopic];
  const transferBatchFromTopics = addressTopic && [getErc1155EventSelector('TransferBatch'), null, addressTopic];

  const {
    data: transferSingleTo,
    isLoading: isTransferSingleToLoading,
    error: transferSingleToError,
  } = useLogsFullBlockRange('ERC1155 TransferSingle (to)', chainId, { topics: transferSingleToTopics });

  const {
    data: transferSingleFrom,
    isLoading: isTransferSingleFromLoading,
    error: transferSingleFromError,
  } = useLogsFullBlockRange('ERC1155 TransferSingle (from)', chainId, { topics: transferSingleFromTopics });

  const {
    data: transferBatchTo,
    isLoading: isTransferBatchToLoading,
    error: transferBatchToError,
  } = useLogsFullBlockRange('ERC1155 TransferBatch (to)', chainId, { topics: transferBatchToTopics });

  const {
    data: transferBatchFrom,
    isLoading: isTransferBatchFromLoading,
    error: transferBatchFromError,
  } = useLogsFullBlockRange('ERC1155 TransferBatch (from)', chainId, { topics: transferBatchFromTopics });

  const isLoading =
    isTransferSingleToLoading || isTransferSingleFromLoading || isTransferBatchToLoading || isTransferBatchFromLoading;
  const error = transferSingleToError || transferSingleFromError || transferBatchToError || transferBatchFromError;

  const events = useMemo(() => {
    if (!transferSingleTo || !transferSingleFrom || !transferBatchTo || !transferBatchFrom) return undefined;
    if (error || isLoading) return undefined;
    return [...transferSingleTo, ...transferSingleFrom, ...transferBatchTo, ...transferBatchFrom];
  }, [transferSingleTo, transferSingleFrom, transferBatchTo, transferBatchFrom]);

  return { events, isLoading, error };
};
