import { useQuery } from '@tanstack/react-query';
import eventsDB from 'lib/databases/events';
import { getLogsProvider } from 'lib/providers';
import { isNullish } from 'lib/utils';
import type { Filter, Log } from 'lib/utils/events';

export const useLogs = (name: string, chainId: number, filter?: Filter) => {
  const result = useQuery<Log[], Error>({
    queryKey: ['logs', filter, chainId],
    queryFn: async () => eventsDB.getLogs(getLogsProvider(chainId), filter!, chainId, name),
    refetchOnWindowFocus: false,
    // The same filter should always return the same logs
    staleTime: Number.POSITIVE_INFINITY,
    enabled:
      !isNullish(chainId) && !isNullish(filter?.fromBlock) && !isNullish(filter?.toBlock) && !isNullish(filter?.topics),
  });

  return result;
};
