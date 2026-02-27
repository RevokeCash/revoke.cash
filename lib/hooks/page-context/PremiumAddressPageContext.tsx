'use client';

import { useQueries } from '@tanstack/react-query';
import { getTokenEvents } from 'lib/chains/events';
import type { SpenderData, SpenderRiskData } from 'lib/interfaces';
import { getTokenPrices } from 'lib/price/utils';
import { deduplicateArray, isNullish } from 'lib/utils';
import {
  type AllowanceUpdateProperties,
  applyRevokeToAllowances,
  applyUpdateToAllowances,
  calculateValueAtRisk,
  getAllowancesFromEvents,
  type OnUpdate,
  type TokenAllowanceData,
} from 'lib/utils/allowances';
import analytics from 'lib/utils/analytics';
import { createViemPublicClientForChain, ORDERED_CHAINS } from 'lib/utils/chains';
import { getEventKey } from 'lib/utils/events';
import { MINUTE } from 'lib/utils/time';
import { isErc721Contract } from 'lib/utils/tokens';
import { getSpenderData } from 'lib/utils/whois';
import React, { type ReactNode, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import { useNameLookup } from '../ethereum/useNameLookup';
import { queryClient } from '../QueryProvider';

export type ChainLoadingStatus = 'loading' | 'success' | 'error';

export interface ChainAllowanceData {
  chainId: number;
  status: ChainLoadingStatus;
  error: Error | null;
  allowances: TokenAllowanceData[];
  totalValueAtRisk: number;
  refetch: () => void;
}

interface PremiumAddressContext {
  address: Address;
  domainName?: string;
  chainData: ChainAllowanceData[];
  isLoading: boolean;
  onUpdate: OnUpdate;
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

  // In-memory state for allowances per chain (keyed by chainId)
  const [baseAllowancesMap, setBaseAllowancesMap] = useState<Map<number, TokenAllowanceData[]>>(new Map());

  // Track which query data references we've already synced to avoid overwriting manual updates
  const syncedQueryDataRef = useRef<Map<number, TokenAllowanceData[] | undefined>>(new Map());

  // Fetch events for all chains in parallel using useQueries
  const eventQueries = useQueries({
    queries: ORDERED_CHAINS.map((chainId) => ({
      queryKey: ['events', address, chainId],
      queryFn: () => getTokenEvents(chainId, address),
      enabled: !isNullish(address) && !isNullish(chainId),
      staleTime: Number.POSITIVE_INFINITY,
    })),
  });

  // Fetch allowances for all chains in parallel
  const allowanceQueries = useQueries({
    queries: ORDERED_CHAINS.map((chainId, index) => {
      const events = eventQueries[index]?.data;
      return {
        queryKey: ['allowances', address, chainId, events?.map(getEventKey)],
        queryFn: async () => {
          const publicClient = createViemPublicClientForChain(chainId);
          const allowances = await getAllowancesFromEvents(address, events!, publicClient, chainId);
          analytics.track('Fetched Allowances', { account: address, chainId });
          return allowances;
        },
        enabled: !isNullish(address) && !isNullish(chainId) && !isNullish(events),
        staleTime: Number.POSITIVE_INFINITY,
      };
    }),
  });

  // Sync query data to in-memory state (only when query data actually changes, not after manual updates)
  useLayoutEffect(() => {
    let hasChanges = false;

    ORDERED_CHAINS.forEach((chainId, index) => {
      const queryData = allowanceQueries[index]?.data;
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
          const queryData = allowanceQueries[index]?.data;
          const lastSyncedData = syncedQueryDataRef.current.get(chainId);

          // Sync this chain's data if it matches what we just marked as synced
          if (queryData && queryData === lastSyncedData) {
            newMap.set(chainId, queryData);
          }
        });

        return newMap;
      });
    }
  }, [allowanceQueries]);

  // Flatten all allowances from all chains for price and spender queries
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

  // Fetch token prices in batches per chain
  const priceQueries = useQueries({
    queries: uniqueErc20TokenAddressesByChain.map(({ chainId, addresses }) => ({
      queryKey: ['tokenPrices', chainId, addresses],
      queryFn: () => getTokenPrices(chainId, addresses),
      staleTime: 5 * MINUTE,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
      enabled: addresses.length > 0,
    })),
  });

  // Fetch spender data for all allowances (TanStack Query deduplicates by queryKey)
  const spenderQueries = useQueries({
    queries: allBaseAllowances.map((allowance) => ({
      queryKey: ['spenderData', allowance.chainId, allowance.payload?.spender],
      queryFn: allowance.payload?.spender
        ? () => getSpenderData(allowance.payload!.spender, allowance.chainId)
        : () => null,
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
    })),
  });

  // Create separate maps for prices (per token) and spender data (per spender)
  const priceMap = useMemo(() => {
    const map = new Map<string, number | null>();

    uniqueErc20TokenAddressesByChain.forEach(({ chainId, addresses }, index) => {
      const queryData = priceQueries[index]?.data;
      if (!queryData) return;

      for (const tokenAddress of addresses) {
        map.set(`${chainId}-${tokenAddress}`, queryData[tokenAddress] ?? null);
      }
    });

    return map;
  }, [uniqueErc20TokenAddressesByChain, priceQueries]);

  const spenderDataMap = useMemo(() => {
    const map = new Map<string, SpenderData | SpenderRiskData | null | undefined>();

    allBaseAllowances.forEach((allowance, index) => {
      const spender = allowance.payload?.spender;
      if (!spender) return;

      const key = `${allowance.chainId}-${spender}`;
      // Only set if not already present (all queries for same spender return same data)
      if (!map.has(key)) {
        map.set(key, spenderQueries[index]?.data);
      }
    });

    return map;
  }, [allBaseAllowances, spenderQueries]);

  // Build chainData array with status, allowances (enriched with price/spender), and computed values
  const chainData = useMemo<ChainAllowanceData[]>(() => {
    return ORDERED_CHAINS.map((chainId, index) => {
      const eventQuery = eventQueries[index];
      const allowanceQuery = allowanceQueries[index];

      // Determine status
      const isError = Boolean(eventQuery?.error || allowanceQuery?.error);
      const isSuccess = Boolean(allowanceQuery?.isSuccess && !isError);

      let status: ChainLoadingStatus = 'loading';
      if (isError) status = 'error';
      else if (isSuccess) status = 'success';

      const error = (allowanceQuery?.error ?? eventQuery?.error ?? null) as Error | null;

      // Use in-memory state, filter to only allowances with active approvals, and enrich with price/spender data
      const baseAllowances = baseAllowancesMap.get(chainId) ?? [];
      const allowances = baseAllowances
        .filter((allowance) => !isNullish(allowance.payload))
        .map((allowance) => {
          const priceKey = `${allowance.chainId}-${allowance.contract.address}`;
          const spenderKey = `${allowance.chainId}-${allowance.payload?.spender}`;

          const price = isErc721Contract(allowance.contract) ? null : (priceMap.get(priceKey) ?? null);
          const metadata = { ...allowance.metadata, price };
          const payload = allowance.payload
            ? { ...allowance.payload, spenderData: spenderDataMap.get(spenderKey) }
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

      return {
        chainId,
        status,
        error,
        allowances,
        totalValueAtRisk,
        refetch,
      };
    });
  }, [eventQueries, allowanceQueries, baseAllowancesMap, priceMap, spenderDataMap, address]);

  // Overall loading state: true only if all chains are still loading
  const isLoading = useMemo(() => {
    return chainData.every((chain) => chain.status === 'loading');
  }, [chainData]);

  // Create onUpdate function that updates in-memory state and invalidates queries
  const onUpdate: OnUpdate = useCallback(
    async (allowance: TokenAllowanceData, updatedProperties: AllowanceUpdateProperties = {}) => {
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
    [address],
  );

  return (
    <PremiumAddressPageContext.Provider
      value={{
        address,
        domainName: domainName ?? resolvedDomainName ?? undefined,
        chainData,
        isLoading,
        onUpdate,
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
