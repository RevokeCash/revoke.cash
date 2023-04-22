import { useQuery } from '@tanstack/react-query';
import eventsDB from 'lib/databases/events';
import type { Filter, Log } from 'lib/interfaces';
import { useEffect } from 'react';
import { useApiSession } from '../useApiSession';
import { useLogsProvider } from './useLogsProvider';

export const useLogs = (name: string, chainId: number, filter: Filter) => {
  const { isLoggedIn } = useApiSession();

  const logsProvider = useLogsProvider({ chainId });

  const result = useQuery<Log[], Error>({
    queryKey: ['logs', logsProvider, filter, chainId, isLoggedIn],
    queryFn: async () => {
      if (!logsProvider || !filter || !chainId || !isLoggedIn) return null;
      if (filter?.fromBlock === undefined || filter?.toBlock === undefined || filter?.topics === undefined) return null;
      const logs = await eventsDB.getLogs(logsProvider, filter, chainId);
      return logs;
    },
    refetchOnWindowFocus: false,
    // The same filter should always return the same logs
    staleTime: Infinity,
  });

  useEffect(() => {
    if (result.data) console.log(`${name} events`, result.data);
  }, [result.data]);

  return result;
};
