import { useQuery } from '@tanstack/react-query';
import type { Filter, Log } from 'lib/interfaces';
import { getLogs } from 'lib/utils';
import { useEffect } from 'react';
import { useLogsProvider } from './useLogsProvider';

export const useLogs = (name: string, chainId: number, filter: Filter) => {
  const logsProvider = useLogsProvider({ chainId });

  const result = useQuery<Log[], Error>({
    queryKey: ['logs', logsProvider, filter],
    queryFn: async () => {
      if (!logsProvider || !filter) return null;
      if (filter?.fromBlock === undefined || filter?.toBlock === undefined || filter?.topics === undefined) return null;
      return getLogs(logsProvider, filter);
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (result.data) console.log(`${name} events`, result.data);
  }, [result.data]);

  return result;
};
