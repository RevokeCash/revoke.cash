'use client';

import { createViemPublicClientForChain, ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { delegationEquals } from '@revoke.cash/core/delegations';
import { AggregateDelegatePlatform } from '@revoke.cash/core/delegations/AggregateDelegatePlatform';
import type { Delegation } from '@revoke.cash/core/delegations/DelegatePlatform';
import { getEip7702DelegatedAddress } from '@revoke.cash/core/eip7702';
import { useQuery } from '@tanstack/react-query';
import analytics from 'lib/utils/analytics';
import { useLayoutEffect, useState } from 'react';
import type { Address, PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';
import { useAddress } from '../../page-context/AddressIdentityContext';
import { useAddressPageContext } from '../../page-context/AddressPageContext';

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

const fetchEip7702Delegations = async (address: Address): Promise<Delegation[]> => {
  const eip7702Delegations = await Promise.allSettled(
    ORDERED_CHAINS.map(async (chainId) => {
      const publicClient = createViemPublicClientForChain(chainId);
      const delegatedAddress = await getEip7702DelegatedAddress(address, publicClient);
      if (delegatedAddress) {
        return {
          type: 'EIP7702',
          delegator: address,
          delegate: delegatedAddress,
          contract: null,
          tokenId: null,
          direction: 'OUTGOING',
          platform: 'EIP7702',
          chainId,
        } as const;
      }

      throw new Error(`No EIP7702 delegated address found for ${address} on chain ${chainId}`);
    }),
  );

  return eip7702Delegations.filter((result) => result.status === 'fulfilled').map((result) => result.value);
};

export const useDelegations = () => {
  const { address } = useAddress();
  const { selectedChainId } = useAddressPageContext();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const publicClient = usePublicClient({ chainId: selectedChainId })!;

  const { data, isLoading, error } = useQuery({
    queryKey: ['delegations', address, selectedChainId],
    queryFn: async () => {
      const delegations = await fetchDelegations(publicClient, selectedChainId, address);
      analytics.track('Fetched Delegations', { account: address, chainId: selectedChainId });
      return delegations;
    },
    enabled: Boolean(publicClient && address && selectedChainId),
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
    error,
    onRevoke,
  };
};

export const useEip7702Delegations = () => {
  const { address } = useAddress();

  const {
    data: delegations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['eip7702-delegations', address],
    queryFn: async () => {
      const eip7702Delegations = await fetchEip7702Delegations(address);
      analytics.track('Fetched EIP7702 Delegations', { account: address });
      return eip7702Delegations;
    },
    enabled: Boolean(address),
  });

  return {
    delegations,
    isLoading,
    error,
  };
};
