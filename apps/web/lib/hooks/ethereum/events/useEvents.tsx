import { getTokenEvents, type TokenEventsResult } from '@revoke.cash/core/chains/events';
import { isNullish } from '@revoke.cash/core/utils';
import { isTooMuchActivityError } from '@revoke.cash/core/utils/errors';
import { useQuery } from '@tanstack/react-query';
import { getLogsProvider } from 'lib/providers';
import type { Address } from 'viem';

export const useEvents = (address: Address, chainId: number) => {
  const { data, isLoading, error } = useQuery<TokenEventsResult, Error>({
    queryKey: ['events', address, chainId, { includeTransferFromEvents: false }],
    queryFn: () =>
      getTokenEvents(chainId, address, getLogsProvider(chainId), {
        includeTransferFromEvents: false,
        maxLogs: 20_000, // Higher logs will lead to hammered RPCs + failures
      }),
    retry: (failureCount, error) => !isTooMuchActivityError(error) && failureCount < 1,
    enabled: !isNullish(address) && !isNullish(chainId),
  });

  return { ...data, isLoading, error };
};
