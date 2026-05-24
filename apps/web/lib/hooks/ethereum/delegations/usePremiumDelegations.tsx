'use client';

import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { delegationEquals } from '@revoke.cash/core/delegations';
import type { Delegation } from '@revoke.cash/core/delegations/DelegatePlatform';
import { useMemo } from 'react';
import { useAddress } from '../../page-context/AddressIdentityContext';
import { queryClient } from '../../QueryProvider';
import { getPremiumDelegationsQueryKey, usePremiumDelegationResults } from './usePremiumDelegationResults';

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

  const delegationResults = usePremiumDelegationResults(address);

  const chainData = useMemo<ChainDelegationsData[]>(() => {
    return ORDERED_CHAINS.map((chainId, index) => {
      const delegationResult = delegationResults[index];
      const delegationsForChain = delegationResult.data ?? [];

      const status = delegationResult.error ? 'error' : delegationResult.isSuccess ? 'success' : 'loading';
      const refetch = async () => {
        await delegationResult?.refetch();
      };

      return { chainId, status, error: delegationResult.error, delegations: delegationsForChain, refetch };
    });
  }, [delegationResults]);

  const onRevoke = (delegation: Delegation) => {
    queryClient.setQueryData<Delegation[] | undefined>(
      getPremiumDelegationsQueryKey(address, delegation.chainId),
      (delegations) => {
        return delegations?.filter((other) => !delegationEquals(other, delegation));
      },
    );
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
