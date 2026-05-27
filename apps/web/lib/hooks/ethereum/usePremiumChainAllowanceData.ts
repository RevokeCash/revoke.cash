'use client';

import {
  type AllowanceUpdateProperties,
  applyRevokeToAllowances,
  applyUpdateToAllowances,
  calculateValueAtRisk,
  type OnUpdate,
  type TokenAllowanceData,
} from '@revoke.cash/core/allowances';
import type { DocumentedChainId } from '@revoke.cash/core/chains';
import type { EnrichedTokenEvent } from '@revoke.cash/core/events';
import { isErc721Contract } from '@revoke.cash/core/tokens';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { queryClient } from '../QueryProvider';
import type { CombinedQueryResult } from './combined-query-result';
import type { AddressData } from './useAddressData';
import { useAllowanceSpenderData } from './useAllowanceSpenderData';
import { type ChainTokenQuery, getBalanceKey, useBalanceData } from './useBalanceData';
import { type PremiumAddressDataResult, updatePremiumAddressDataCache } from './usePremiumAddressData';
import { getPriceKey, usePriceData } from './usePriceData';
import { getSpenderKey } from './useSpenderData';

export type ChainLoadingStatus = 'loading' | 'success' | 'error';

export interface ChainAllowanceData {
  chainId: number;
  status: ChainLoadingStatus;
  error: Error | null;
  allowances: TokenAllowanceData[];
  events: EnrichedTokenEvent[];
  totalValueAtRisk: number;
  lastChecked: string | null;
  isRefreshing: boolean;
  refreshError: Error | null;
  refetch: () => void;
}

interface UsePremiumChainAllowanceDataParameters {
  address: Address;
  chains: readonly DocumentedChainId[];
  currentResults: PremiumAddressDataResult[];
  addressDataResults: CombinedQueryResult<AddressData>[];
  isHistorical: boolean;
}

export const usePremiumChainAllowanceData = ({
  address,
  chains,
  currentResults,
  addressDataResults,
  isHistorical,
}: UsePremiumChainAllowanceDataParameters): {
  chainData: ChainAllowanceData[];
  isLoading: boolean;
  onUpdate: OnUpdate;
} => {
  const allowancesByChain = useMemo(() => {
    return chains.map((_chainId, index) => {
      const result = isHistorical ? addressDataResults[index] : currentResults[index];
      return result?.data?.allowances ?? [];
    });
  }, [addressDataResults, currentResults, chains, isHistorical]);

  const allEffectiveAllowances = useMemo(() => {
    return allowancesByChain.flat();
  }, [allowancesByChain]);

  const tokenDataQueries = useMemo<ChainTokenQuery[]>(() => {
    return chains.map((chainId, index) => {
      const chainAllowances = allowancesByChain[index] ?? [];
      const tokens = deduplicateArray(
        chainAllowances.map((allowance) => ({
          address: allowance.contract.address,
          isErc721: isErc721Contract(allowance.contract),
        })),
        (token) => token.address,
      ).sort((a, b) => a.address.localeCompare(b.address));

      const blockNumber = getHistoricalBalanceBlock(addressDataResults[index], isHistorical);
      return { chainId, owner: address, tokens, blockNumber };
    });
  }, [addressDataResults, allowancesByChain, address, chains, isHistorical]);

  const priceData = usePriceData(tokenDataQueries);
  const balanceData = useBalanceData(tokenDataQueries);
  const spenderData = useAllowanceSpenderData(allEffectiveAllowances);

  const chainData = useMemo<ChainAllowanceData[]>(() => {
    return chains.map((chainId, index) => {
      const dataResult = addressDataResults[index];
      const currentResult = currentResults[index];

      const baseAllowances = allowancesByChain[index] ?? [];
      const enrichedAllowances = enrichAllowances(baseAllowances, {
        isHistorical,
        priceData,
        balanceData,
        spenderData,
      });
      const totalValueAtRisk = calculateTotalValueAtRisk(enrichedAllowances);

      const refetch = () => {
        currentResult?.refresh();
      };

      return {
        chainId,
        status: getChainDataStatus(dataResult),
        error: dataResult?.error ?? null,
        allowances: enrichedAllowances,
        events: dataResult?.data?.events ?? [],
        totalValueAtRisk,
        lastChecked: currentResult?.data?.state.checkedAt ?? null,
        isRefreshing: !isHistorical && Boolean(currentResult?.isRefreshing),
        refreshError: !isHistorical ? (currentResult?.refreshError ?? null) : null,
        refetch,
      };
    });
  }, [
    addressDataResults,
    currentResults,
    allowancesByChain,
    priceData,
    balanceData,
    spenderData,
    chains,
    isHistorical,
  ]);

  const isLoading = useMemo(() => chainData.some((chain) => chain.status === 'loading'), [chainData]);

  const onUpdate: OnUpdate = useCallback(
    async (allowance: TokenAllowanceData, updatedProperties: AllowanceUpdateProperties = {}) => {
      // Optimistic updates only make sense for current state — time machine shows immutable
      // historical data, and the time-machine modal also disables row-selection / edit cells.
      if (isHistorical) return;
      const chainId = allowance.chainId;

      await queryClient.invalidateQueries({ queryKey: ['blockNumber', chainId], refetchType: 'none' });
      await queryClient.invalidateQueries({
        queryKey: ['premium-address-data', address, chainId],
        refetchType: 'none',
      });

      updatePremiumAddressDataCache(address, chainId, (addressData) => {
        const newAllowances =
          !updatedProperties.amount || updatedProperties.amount === 0n
            ? applyRevokeToAllowances(addressData.allowances, allowance)
            : applyUpdateToAllowances(addressData.allowances, allowance, updatedProperties);

        return { ...addressData, allowances: newAllowances };
      });
    },
    [address, isHistorical],
  );

  return { chainData, isLoading, onUpdate };
};

const getHistoricalBalanceBlock = (
  result: CombinedQueryResult<{ state: { computedToBlock: number | null } }> | undefined,
  isHistorical: boolean,
): bigint | undefined => {
  if (!isHistorical) return undefined;
  const computedToBlock = result?.data?.state.computedToBlock;
  return isNullish(computedToBlock) ? undefined : BigInt(computedToBlock);
};

const getChainDataStatus = (result: CombinedQueryResult<unknown> | undefined): ChainLoadingStatus => {
  if (!result || result.isLoading) return 'loading';
  if (result.error) return 'error';
  if (result.isSuccess) return 'success';
  return 'loading';
};

interface AllowanceEnrichmentData {
  isHistorical: boolean;
  priceData: ReturnType<typeof usePriceData>;
  balanceData: ReturnType<typeof useBalanceData>;
  spenderData: ReturnType<typeof useAllowanceSpenderData>;
}

type AllowanceWithPayload = TokenAllowanceData & { payload: NonNullable<TokenAllowanceData['payload']> };

const hasPayload = (allowance: TokenAllowanceData): allowance is AllowanceWithPayload => {
  return !isNullish(allowance.payload);
};

const enrichAllowances = (
  allowances: TokenAllowanceData[],
  { isHistorical, priceData, balanceData, spenderData }: AllowanceEnrichmentData,
): TokenAllowanceData[] => {
  return allowances.filter(hasPayload).map((allowance) => {
    const priceKey = getPriceKey(allowance.chainId, allowance.contract.address);
    const balanceKey = getBalanceKey(allowance.chainId, allowance.contract.address);
    const spenderKey = getSpenderKey(allowance.chainId, allowance.payload.spender);

    const price = isHistorical || isErc721Contract(allowance.contract) ? null : priceData[priceKey];
    const balance = balanceData[balanceKey];
    const metadata = { ...allowance.metadata, price };
    const payload = { ...allowance.payload, spenderData: spenderData[spenderKey] };

    return { ...allowance, balance, metadata, payload };
  });
};

const calculateTotalValueAtRisk = (allowances: TokenAllowanceData[]): number => {
  const sortedByValue = [...allowances].sort((a, b) => (calculateValueAtRisk(b) ?? 0) - (calculateValueAtRisk(a) ?? 0));
  const uniqueTokens = deduplicateArray(sortedByValue, (allowance) => allowance.contract.address);
  return uniqueTokens.reduce((sum, allowance) => sum + (calculateValueAtRisk(allowance) ?? 0), 0);
};
