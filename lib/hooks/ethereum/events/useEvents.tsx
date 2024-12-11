import { useQuery } from '@tanstack/react-query';
import { getTokenEvents } from 'lib/chains/events';
import { isNullish } from 'lib/utils';
import type { Address } from 'viem';

export const useEvents = (address: Address, chainId: number) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', address, chainId],
    queryFn: () => getTokenEvents(chainId, address),
    enabled: !isNullish(address) && !isNullish(chainId),
  });

  return { events: data, isLoading, error };
};
