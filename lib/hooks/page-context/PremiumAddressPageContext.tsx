'use client';

import { usePathname } from 'lib/i18n/navigation';
import { deduplicateArray, isNullish } from 'lib/utils';
import {
  type AllowanceUpdateProperties,
  applyRevokeToAllowances,
  applyUpdateToAllowances,
  calculateValueAtRisk,
  type OnUpdate,
  type TokenAllowanceData,
} from 'lib/utils/allowances';
import { ORDERED_CHAINS } from 'lib/utils/chains';
import type { EnrichedTokenEvent } from 'lib/utils/events';
import { isErc721Contract } from 'lib/utils/tokens';
import { useParams } from 'next/navigation';
import React, { type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import type { CombinedQueryResult } from '../ethereum/combined-query-result';
import { useAllowanceSpenderData } from '../ethereum/useAllowanceSpenderData';
import { useNameLookup } from '../ethereum/useNameLookup';
import { usePremiumAllowanceResults } from '../ethereum/usePremiumAllowanceResults';
import { usePremiumEventResults } from '../ethereum/usePremiumEventResults';
import { getPriceKey, usePriceData } from '../ethereum/usePriceData';
import { getSpenderKey } from '../ethereum/useSpenderData';
import { useTimeMachineBlocks } from '../ethereum/useTimeMachineBlocks';
import { queryClient } from '../QueryProvider';

export type ChainLoadingStatus = 'loading' | 'success' | 'error';

export interface ChainAllowanceData {
  chainId: number;
  status: ChainLoadingStatus;
  error: Error | null;
  events: EnrichedTokenEvent[];
  allowances: TokenAllowanceData[];
  totalValueAtRisk: number;
  refetch: () => void;
}

export interface TimeMachineState {
  timestamp: number | undefined;
  setTimestamp: (timestamp: number | undefined) => void;
  isActive: boolean;
  isLoading: boolean;
  oldestEventTimestamp: number | undefined;
}

interface PremiumAddressContext {
  address: Address;
  domainName?: string;
  chainData: ChainAllowanceData[];
  isLoading: boolean;
  onUpdate: OnUpdate;
  timeMachine: TimeMachineState;
}

interface Props {
  children: ReactNode;
  address: Address;
  domainName?: string | null;
}

// We pass in undefined as the default value, since there should always be a provider for this context
export const PremiumAddressPageContext = React.createContext<PremiumAddressContext>(undefined as any);

export const PremiumAddressPageContextProvider = ({ children, address, domainName }: Props) => {
  const { domainName: resolvedDomainName } = useNameLookup(domainName ? undefined : address);

  // Time Machine state
  const [rawTimeMachineTimestamp, setTimeMachineTimestamp] = useState<number | undefined>(undefined);

  // Auto-disable time machine when navigating away from the allowances tab
  const { addressOrName } = useParams<{ addressOrName: string }>();
  const path = usePathname();
  const isAllowancesTab = path?.endsWith(`/address/${addressOrName}`);
  const timeMachineTimestamp = isAllowancesTab ? rawTimeMachineTimestamp : undefined;
  const isTimeMachineActive = timeMachineTimestamp !== undefined;
  useEffect(() => {
    if (!isAllowancesTab) setTimeMachineTimestamp(undefined);
  }, [isAllowancesTab]);

  // In-memory state for allowances per chain (keyed by chainId)
  const [baseAllowancesMap, setBaseAllowancesMap] = useState<Map<number, TokenAllowanceData[]>>(new Map());

  // Track which query data references we've already synced to avoid overwriting manual updates
  const syncedQueryDataRef = useRef<Map<number, TokenAllowanceData[] | undefined>>(new Map());

  const eventResults = usePremiumEventResults(address);

  // Only look up blocks for chains that actually have events (skip inactive chains)
  const activeChainIds = useMemo(() => {
    return eventResults.flatMap((result, index) =>
      result.data && result.data.length > 0 ? [ORDERED_CHAINS[index]] : [],
    );
  }, [eventResults]);

  const timeMachineBlocks = useTimeMachineBlocks(timeMachineTimestamp, activeChainIds);

  // When time machine is active, filter events to only those at or before the target block
  const filteredEventResults = useMemo(() => {
    if (!isTimeMachineActive) return eventResults;

    return eventResults.map((result, index) => {
      if (!result.data) return result;
      if (result.data.length === 0) return result;

      const chainId = ORDERED_CHAINS[index];
      const targetBlock = timeMachineBlocks[chainId];

      // undefined = still loading the block lookup
      if (targetBlock === undefined) return { ...result, data: undefined, isLoading: true, isSuccess: false };

      // null = chain did not exist at the target timestamp, so no approvals possible
      if (targetBlock === null) return { ...result, data: [] };

      const filteredEvents = result.data.filter((event) => event.rawLog.blockNumber <= targetBlock);
      return { ...result, data: filteredEvents };
    });
  }, [eventResults, isTimeMachineActive, timeMachineBlocks]);

  const allowanceResults = usePremiumAllowanceResults(
    address,
    filteredEventResults,
    isTimeMachineActive ? timeMachineBlocks : undefined,
    timeMachineTimestamp,
  );

  // Sync query data to in-memory state (only when query data actually changes, not after manual updates)
  useEffect(() => {
    let hasChanges = false;

    ORDERED_CHAINS.forEach((chainId, index) => {
      const queryData = allowanceResults[index]?.data;
      const lastSyncedData = syncedQueryDataRef.current.get(chainId);

      // Only sync if the query data reference has changed (new fetch), not if we manually modified the map
      if (queryData && queryData !== lastSyncedData) {
        syncedQueryDataRef.current.set(chainId, queryData);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setBaseAllowancesMap((prevMap) => {
        const newMap = new Map(prevMap);

        ORDERED_CHAINS.forEach((chainId, index) => {
          const queryData = allowanceResults[index]?.data;
          const lastSyncedData = syncedQueryDataRef.current.get(chainId);

          // Sync this chain's data if it matches what we just marked as synced
          if (queryData && queryData === lastSyncedData) {
            newMap.set(chainId, queryData);
          }
        });

        return newMap;
      });
    }
  }, [allowanceResults]);

  // Flatten all allowances from all chains for spender queries
  const allBaseAllowances = useMemo(() => {
    const allowances: TokenAllowanceData[] = [];
    for (const chainAllowances of baseAllowancesMap.values()) {
      allowances.push(...chainAllowances);
    }
    return allowances;
  }, [baseAllowancesMap]);

  const uniqueErc20TokenAddressesByChain = useMemo(() => {
    return ORDERED_CHAINS.map((chainId) => {
      const chainAllowances = baseAllowancesMap.get(chainId) ?? [];
      const erc20Addresses = chainAllowances
        .filter((allowance) => !isErc721Contract(allowance.contract))
        .map((allowance) => allowance.contract.address);

      return { chainId, addresses: deduplicateArray(erc20Addresses).sort() };
    });
  }, [baseAllowancesMap]);

  const priceData = usePriceData(uniqueErc20TokenAddressesByChain);
  const spenderData = useAllowanceSpenderData(allBaseAllowances);

  // Build chainData array with status, allowances (enriched with price/spender), and computed values
  const chainData = useMemo<ChainAllowanceData[]>(() => {
    return ORDERED_CHAINS.map((chainId, index) => {
      const eventResult = eventResults[index];
      const allowanceResult = allowanceResults[index];
      const status = getChainAllowanceLoadingStatus(eventResult, allowanceResult);

      const error = allowanceResult?.error ?? eventResult?.error ?? null;

      // Use in-memory state, filter to only allowances with active approvals, and enrich with price/spender data
      const baseAllowances = baseAllowancesMap.get(chainId) ?? [];
      const allowances = baseAllowances
        .filter((allowance) => !isNullish(allowance.payload))
        .map((allowance) => {
          const priceKey = getPriceKey(allowance.chainId, allowance.contract.address);
          const spenderKey = getSpenderKey(allowance.chainId, allowance.payload!.spender);

          const price = isTimeMachineActive ? null : isErc721Contract(allowance.contract) ? null : priceData[priceKey];
          const metadata = { ...allowance.metadata, price };
          const payload = allowance.payload
            ? { ...allowance.payload, spenderData: spenderData[spenderKey] }
            : undefined;

          return { ...allowance, metadata, payload };
        });

      // Calculate total value at risk for this chain (take max per token to avoid counting same balance multiple times)
      // Sort by value descending, deduplicate by token, then sum
      const sortedByValue = [...allowances].sort(
        (a, b) => (calculateValueAtRisk(b) ?? 0) - (calculateValueAtRisk(a) ?? 0),
      );
      const uniqueTokens = deduplicateArray(sortedByValue, (a) => a.contract.address);
      const totalValueAtRisk = uniqueTokens.reduce((sum, a) => sum + (calculateValueAtRisk(a) ?? 0), 0);

      // Refetch function for this chain
      const refetch = () => {
        queryClient.invalidateQueries({ queryKey: ['events', address, chainId] });
        queryClient.invalidateQueries({ queryKey: ['allowances', address, chainId] });
      };

      const events = eventResults[index]?.data ?? [];

      return {
        chainId,
        status,
        error,
        events,
        allowances,
        totalValueAtRisk,
        refetch,
      };
    });
  }, [eventResults, allowanceResults, baseAllowancesMap, priceData, spenderData, address, isTimeMachineActive]);

  // Overall loading state: true only if any chain is still loading
  const isLoading = useMemo(() => chainData.some((chain) => chain.status === 'loading'), [chainData]);

  // Compute the oldest event timestamp across all chains (for the time machine slider range)
  const oldestEventTimestamp = useMemo(() => {
    const timestamps = eventResults.flatMap((result) => result.data ?? []).map((event) => event.time.timestamp);
    return timestamps.length > 0 ? Math.min(...timestamps) : undefined;
  }, [eventResults]);

  const timeMachine = useMemo<TimeMachineState>(
    () => ({
      timestamp: timeMachineTimestamp,
      setTimestamp: setTimeMachineTimestamp,
      isActive: isTimeMachineActive,
      isLoading,
      oldestEventTimestamp,
    }),
    [timeMachineTimestamp, isTimeMachineActive, isLoading, oldestEventTimestamp],
  );

  // Create onUpdate function that updates in-memory state and invalidates queries
  const onUpdate: OnUpdate = useCallback(
    async (allowance: TokenAllowanceData, updatedProperties: AllowanceUpdateProperties = {}) => {
      if (isTimeMachineActive) return;
      const chainId = allowance.chainId;

      // Invalidate queries for background refetch
      await queryClient.invalidateQueries({
        queryKey: ['blockNumber', chainId],
        refetchType: 'none',
      });

      await queryClient.invalidateQueries({
        queryKey: ['events', address, chainId],
        refetchType: 'none',
      });

      await queryClient.invalidateQueries({
        queryKey: ['allowances', address, chainId],
        refetchType: 'none',
      });

      // Update in-memory state immediately using shared utility functions
      setBaseAllowancesMap((prevMap) => {
        const chainAllowances = prevMap.get(chainId);
        if (!chainAllowances) return prevMap;

        const newAllowances =
          !updatedProperties.amount || updatedProperties.amount === 0n
            ? applyRevokeToAllowances(chainAllowances, allowance)
            : applyUpdateToAllowances(chainAllowances, allowance, updatedProperties);

        const newMap = new Map(prevMap);
        newMap.set(chainId, newAllowances);
        return newMap;
      });
    },
    [address, isTimeMachineActive],
  );

  return (
    <PremiumAddressPageContext.Provider
      value={{
        address,
        domainName: domainName ?? resolvedDomainName ?? undefined,
        chainData,
        isLoading,
        onUpdate,
        timeMachine,
      }}
    >
      {children}
    </PremiumAddressPageContext.Provider>
  );
};

export const usePremiumAddressPageContext = () => {
  const context = useContext(PremiumAddressPageContext);
  if (!context) {
    throw new Error('usePremiumAddressPageContext must be used within a PremiumAddressPageContextProvider');
  }
  return context;
};

export const useTimeMachine = () => {
  return usePremiumAddressPageContext().timeMachine;
};

const getChainAllowanceLoadingStatus = (
  eventResult: CombinedQueryResult<EnrichedTokenEvent[]>,
  allowanceResult: CombinedQueryResult<TokenAllowanceData[]>,
): ChainLoadingStatus => {
  if (eventResult.isLoading || allowanceResult.isLoading) return 'loading';
  if (eventResult.error || allowanceResult.error) return 'error';
  if (allowanceResult.isSuccess) return 'success';
  return 'loading';
};
