import eventsCache from '@revoke.cash/core/cache/events';
import type { Filter, Log } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import { getLogsProvider } from 'lib/providers';

export const useLogs = (name: string, chainId: number, filter?: Filter) => {
  const result = useQuery<Log[], Error>({
    queryKey: ['logs', filter, chainId],
    queryFn: async () => eventsCache.getLogs(getLogsProvider(chainId), filter!, chainId, name),
    refetchOnWindowFocus: false,
    // The same filter should always return the same logs
    staleTime: Number.POSITIVE_INFINITY,
    enabled:
      !isNullish(chainId) && !isNullish(filter?.fromBlock) && !isNullish(filter?.toBlock) && !isNullish(filter?.topics),
  });

  return result;
};
