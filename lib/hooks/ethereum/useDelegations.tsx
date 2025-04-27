'use client';

import { useQuery } from '@tanstack/react-query';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { createDelegatePlatforms } from 'lib/delegate/DelegatePlatformFactory';
import { isNullish } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { useLayoutEffect, useState } from 'react';
import type { Address, PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';
import { useAddressPageContext } from '../page-context/AddressPageContext';

const fetchDelegations = async (
  publicClient: PublicClient,
  chainId: number,
  address: Address,
): Promise<Delegation[]> => {
  if (!publicClient || !address) return [];

  const platforms = createDelegatePlatforms(publicClient, chainId);

  if (!platforms.length) return [];

  try {
    const allDelegationsArrays = await Promise.all(platforms.map((platform) => platform.getDelegations(address)));

    return allDelegationsArrays.flat();
  } catch (error) {
    console.error('Error fetching delegations:', error);
    return [];
  }
};

export const useDelegations = () => {
  const { address, selectedChainId } = useAddressPageContext();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const publicClient = usePublicClient({ chainId: selectedChainId })!;

  const enabled = Boolean(publicClient && address && selectedChainId);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['delegations', address, selectedChainId],
    queryFn: async () => {
      if (!enabled) return [];
      const delegations = await fetchDelegations(publicClient, selectedChainId, address as Address);
      analytics.track('Fetched Delegations', { account: address, chainId: selectedChainId });
      return delegations;
    },
    enabled,
  });

  useLayoutEffect(() => {
    if (data) {
      setDelegations(data);
    }
  }, [data]);

  const outgoingDelegations = delegations.filter((delegation) => delegation.direction === 'OUTGOING');
  const incomingDelegations = delegations.filter((delegation) => delegation.direction === 'INCOMING');

  const onRevoke = (delegation: Delegation) => {
    setDelegations((previousDelegations) => {
      return previousDelegations.filter((other) => {
        if (isNullish(other.delegator) || isNullish(other.delegate)) return true;
        if (other.delegator !== delegation.delegator) return true;
        if (other.delegate !== delegation.delegate) return true;
        if (other.type !== delegation.type) return true;
        if (other.contract !== delegation.contract) return true;
        if (other.tokenId !== delegation.tokenId) return true;
        return false;
      });
    });
  };

  return {
    delegations,
    outgoingDelegations,
    incomingDelegations,
    isLoading,
    isError,
    error,
    refetch,
    onRevoke,
  };
};
