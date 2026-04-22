import { getTokenEvents } from '@revoke.cash/core/chains/events';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import { getLogsProvider } from 'lib/providers';
import type { Address } from 'viem';

export const useEvents = (address: Address, chainId: number) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', address, chainId],
    queryFn: () => getTokenEvents(chainId, address, getLogsProvider(chainId)),
    enabled: !isNullish(address) && !isNullish(chainId),
  });

  return { ...data, isLoading, error };
};
