import { getTokenEvents, type TokenEventsResult } from '@revoke.cash/core/chains/events';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import { getLogsProvider } from 'lib/providers';
import type { Address } from 'viem';

export const useEvents = (address: Address, chainId: number) => {
  const includeTransferFromEvents = false;

  const { data, isLoading, error } = useQuery<TokenEventsResult, Error>({
    queryKey: ['events', address, chainId, { includeTransferFromEvents }],
    queryFn: () => getTokenEvents(chainId, address, getLogsProvider(chainId), { includeTransferFromEvents }),
    enabled: !isNullish(address) && !isNullish(chainId),
  });

  return { ...data, isLoading, error };
};
