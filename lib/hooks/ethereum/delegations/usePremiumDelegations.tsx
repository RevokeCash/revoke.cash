'use client';

import { useQueries } from '@tanstack/react-query';
import { AggregateDelegatePlatform } from 'lib/delegations/AggregateDelegatePlatform';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
import { delegationEquals, isNullish } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { CHAIN_SELECT_MAINNETS, createViemPublicClientForChain } from 'lib/utils/chains';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Address, PublicClient } from 'viem';
import { useAddress } from '../../page-context/AddressIdentityContext';

const fetchDelegations = async (
  publicClient: PublicClient,
  chainId: number,
  address: Address,
): Promise<Delegation[]> => {
  if (!publicClient || !address) return [];

  const delegationPlatform = new AggregateDelegatePlatform(publicClient, chainId);
  return delegationPlatform.getDelegations(address);
};

export type ChainDelegationsLoadingStatus = 'loading' | 'success' | 'error';

export interface ChainDelegationsData {
  chainId: number;
  status: ChainDelegationsLoadingStatus;
  error: Error | null;
  delegations: Delegation[];
  refetch: () => Promise<void>;
}

export const usePremiumDelegations = () => {
  const { address } = useAddress();

  // In-memory state for delegations per chain (keyed by chainId)
  const [baseDelegationsMap, setBaseDelegationsMap] = useState<Map<number, Delegation[]>>(new Map());

  // Track which query data references we've already synced to avoid overwriting manual updates
  const syncedQueryDataRef = useRef<Map<number, Delegation[] | undefined>>(new Map());

  // Reset in-memory state when switching addresses
  useLayoutEffect(() => {
    if (isNullish(address)) return;

    setBaseDelegationsMap(new Map());
    syncedQueryDataRef.current.clear();
  }, [address]);

  const delegationQueries = useQueries({
    queries: CHAIN_SELECT_MAINNETS.map((chainId) => ({
      queryKey: ['delegations', address, chainId],
      queryFn: async () => {
        const publicClient = createViemPublicClientForChain(chainId);
        const delegations = await fetchDelegations(publicClient, chainId, address as Address);
        analytics.track('Fetched Delegations', { account: address, chainId });
        return delegations;
      },
      enabled: !isNullish(address),
      staleTime: Number.POSITIVE_INFINITY,
    })),
  });

  // Sync query data to in-memory state (only when query data actually changes, not after manual updates)
  useLayoutEffect(() => {
    let hasChanges = false;

    CHAIN_SELECT_MAINNETS.forEach((chainId, index) => {
      const queryData = delegationQueries[index]?.data;
      const lastSyncedData = syncedQueryDataRef.current.get(chainId);

      if (!isNullish(queryData) && queryData !== lastSyncedData) {
        syncedQueryDataRef.current.set(chainId, queryData);
        hasChanges = true;
      }
    });

    if (!hasChanges) return;

    setBaseDelegationsMap((prevMap) => {
      const newMap = new Map(prevMap);

      CHAIN_SELECT_MAINNETS.forEach((chainId, index) => {
        const queryData = delegationQueries[index]?.data;
        const lastSyncedData = syncedQueryDataRef.current.get(chainId);

        if (!isNullish(queryData) && queryData === lastSyncedData) {
          newMap.set(chainId, queryData);
        }
      });

      return newMap;
    });
  }, [delegationQueries]);

  const chainData = useMemo<ChainDelegationsData[]>(() => {
    return CHAIN_SELECT_MAINNETS.map((chainId, index) => {
      const delegationQuery = delegationQueries[index];
      const delegationsForChain = baseDelegationsMap.get(chainId) ?? [];
      const hasLoadedData = !isNullish(delegationQuery?.data);
      const isError = Boolean(delegationQuery?.error);
      const isSuccess = Boolean(hasLoadedData && !isError);

      let status: ChainDelegationsLoadingStatus = 'loading';
      if (isError) status = 'error';
      else if (isSuccess) status = 'success';

      const error = (delegationQuery?.error ?? null) as Error | null;

      const refetch = async () => {
        await delegationQuery?.refetch();
      };

      return { chainId, status, error, delegations: delegationsForChain, refetch };
    });
  }, [delegationQueries, baseDelegationsMap]);

  const onRevoke = (delegation: Delegation) => {
    setBaseDelegationsMap((previousMap) => {
      const chainDelegations = previousMap.get(delegation.chainId);
      if (!chainDelegations) return previousMap;

      const newMap = new Map(previousMap);
      newMap.set(
        delegation.chainId,
        chainDelegations.filter((other) => !delegationEquals(other, delegation)),
      );
      return newMap;
    });
  };

  const isLoading = useMemo(() => {
    return chainData.some((chain) => chain.status === 'loading');
  }, [chainData]);

  const error = useMemo(() => {
    const allChainsFailed = chainData.every((chain) => chain.status === 'error');
    if (!allChainsFailed) return undefined;

    return chainData.find((chain) => chain.error)?.error ?? undefined;
  }, [chainData]);

  return {
    chainData,
    isLoading,
    error,
    onRevoke,
  };
};
