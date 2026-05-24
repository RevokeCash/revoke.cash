import {
  type AllowanceDerivationOptions,
  getAllowancesFromEvents,
  type TokenAllowanceData,
} from '@revoke.cash/core/allowances';
import { findBlockByTimestamp } from '@revoke.cash/core/blocks';
import { createViemPublicClientForChain, type DocumentedChainId } from '@revoke.cash/core/chains';
import { getEventKey } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { useQueries } from '@tanstack/react-query';
import type { Address } from 'viem';
import type { CombinedQueryResult } from './combined-query-result';
import type { AddressData } from './useAddressData';

export const useTimeMachineAddressData = (
  owner: Address,
  chains: readonly DocumentedChainId[],
  currentAddressDataResults: CombinedQueryResult<AddressData>[],
  targetTimestamp: number | undefined,
): CombinedQueryResult<AddressData>[] => {
  return useQueries({
    queries: chains.map((chainId, index) => {
      const currentResult = currentAddressDataResults[index];
      const currentData = currentResult?.data;
      const events = currentData?.events ?? [];
      const hasHistoricalEvents =
        !isNullish(targetTimestamp) && events.some((event) => event.time.timestamp <= targetTimestamp);

      return {
        queryKey: [
          'time-machine-address-data',
          owner,
          chainId,
          targetTimestamp,
          currentData?.state.computedToBlock,
          events.map(getEventKey),
        ] as const,
        queryFn: () => getHistoricalAddressData(owner, chainId, currentData!, targetTimestamp!),
        enabled:
          !isNullish(targetTimestamp) &&
          currentResult?.isSuccess === true &&
          !isNullish(currentData) &&
          hasHistoricalEvents,
        staleTime: Number.POSITIVE_INFINITY,
      };
    }),
    combine: (historicalResults) => {
      if (isNullish(targetTimestamp)) return currentAddressDataResults;

      return chains.map((_chainId, index): CombinedQueryResult<AddressData> => {
        const currentResult = currentAddressDataResults[index];
        if (!currentResult || currentResult.isLoading) return loadingResult();
        if (currentResult.error) return errorResult(currentResult.error);

        const currentData = currentResult.data;
        if (!currentData) return loadingResult();

        if (!currentData.events.some((event) => event.time.timestamp <= targetTimestamp)) {
          return successResult(toHistoricalAddressData(currentData, [], null));
        }

        const historicalResult = historicalResults[index];
        if (historicalResult?.error) return errorResult(historicalResult.error);
        if (historicalResult?.isSuccess && historicalResult.data) return successResult(historicalResult.data);

        return { ...loadingResult(), data: toHistoricalAddressData(currentData, [], null) };
      });
    },
  });
};

const getHistoricalAddressData = async (
  owner: Address,
  chainId: DocumentedChainId,
  currentData: AddressData,
  targetTimestamp: number,
): Promise<AddressData> => {
  const publicClient = createViemPublicClientForChain(chainId);
  const block = await findBlockByTimestamp(publicClient, targetTimestamp);

  if (!block) return toHistoricalAddressData(currentData, [], null);

  const historicalEvents = currentData.events.filter((event) => event.rawLog.blockNumber <= block.blockNumber);
  if (historicalEvents.length === 0) return toHistoricalAddressData(currentData, [], block.blockNumber);

  const options: AllowanceDerivationOptions = {
    blockNumber: BigInt(block.blockNumber),
    referenceTime: targetTimestamp,
    transferEventsAvailable: false,
  };
  const allowances = await getAllowancesFromEvents(owner, historicalEvents, publicClient, chainId, options);

  return toHistoricalAddressData(currentData, allowances, block.blockNumber);
};

const toHistoricalAddressData = (
  currentData: AddressData,
  allowances: TokenAllowanceData[],
  computedToBlock: number | null,
): AddressData => ({
  state: {
    checkedAt: currentData.state.checkedAt,
    computedToBlock,
  },
  allowances,
  events: currentData.events,
});

const loadingResult = (): CombinedQueryResult<AddressData> => ({
  data: undefined,
  error: null,
  isLoading: true,
  isSuccess: false,
});

const errorResult = (error: Error): CombinedQueryResult<AddressData> => ({
  data: undefined,
  error,
  isLoading: false,
  isSuccess: false,
});

const successResult = (data: AddressData): CombinedQueryResult<AddressData> => ({
  data,
  error: null,
  isLoading: false,
  isSuccess: true,
});
