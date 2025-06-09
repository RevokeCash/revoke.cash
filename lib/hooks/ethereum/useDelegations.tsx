'use client';

import { useQuery } from '@tanstack/react-query';
import { AggregateDelegatePlatform } from 'lib/delegate/AggregateDelegatePlatform';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { delegationEquals } from 'lib/utils';
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

  const delegationPlatform = new AggregateDelegatePlatform(publicClient, chainId);

  try {
    return delegationPlatform.getDelegations(address);
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
      return previousDelegations.filter((other) => !delegationEquals(other, delegation));
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
