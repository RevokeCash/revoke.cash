'use client';

import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { delegationEquals } from '@revoke.cash/core/delegations';
import type { Delegation } from '@revoke.cash/core/delegations/DelegatePlatform';
import { isNullish } from '@revoke.cash/core/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAddress } from '../../page-context/AddressIdentityContext';
import { usePremiumDelegationResults } from './usePremiumDelegationResults';

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
  useEffect(() => {
    if (isNullish(address)) return;

    setBaseDelegationsMap(new Map());
    syncedQueryDataRef.current.clear();
  }, [address]);

  const delegationResults = usePremiumDelegationResults(address);

  // Sync query data to in-memory state (only when query data actually changes, not after manual updates)
  useEffect(() => {
    let hasChanges = false;

    ORDERED_CHAINS.forEach((chainId, index) => {
      const queryData = delegationResults[index]?.data;
      const lastSyncedData = syncedQueryDataRef.current.get(chainId);

      if (!isNullish(queryData) && queryData !== lastSyncedData) {
        syncedQueryDataRef.current.set(chainId, queryData);
        hasChanges = true;
      }
    });

    if (!hasChanges) return;

    setBaseDelegationsMap((prevMap) => {
      const newMap = new Map(prevMap);

      ORDERED_CHAINS.forEach((chainId, index) => {
        const queryData = delegationResults[index]?.data;
        const lastSyncedData = syncedQueryDataRef.current.get(chainId);

        if (!isNullish(queryData) && queryData === lastSyncedData) {
          newMap.set(chainId, queryData);
        }
      });

      return newMap;
    });
  }, [delegationResults]);

  const chainData = useMemo<ChainDelegationsData[]>(() => {
    return ORDERED_CHAINS.map((chainId, index) => {
      const delegationResult = delegationResults[index];
      const delegationsForChain = baseDelegationsMap.get(chainId) ?? [];

      const status = delegationResult.error ? 'error' : delegationResult.isSuccess ? 'success' : 'loading';
      const refetch = async () => {
        await delegationResult?.refetch();
      };

      return { chainId, status, error: delegationResult.error, delegations: delegationsForChain, refetch };
    });
  }, [delegationResults, baseDelegationsMap]);

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
