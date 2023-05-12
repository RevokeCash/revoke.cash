import { useQuery } from '@tanstack/react-query';
import eventsDB from 'lib/databases/events';
import type { Filter, Log } from 'lib/interfaces';
import { useEffect } from 'react';
import { useApiSession } from '../useApiSession';
import { useLogsProvider } from './useLogsProvider';

export const useLogs = (name: string, chainId: number, filter: Filter) => {
  const { isLoggedIn, loggingIn } = useApiSession();

  const logsProvider = useLogsProvider({ chainId });

  const result = useQuery<Log[], Error>({
    queryKey: ['logs', logsProvider, filter, chainId, isLoggedIn],
    queryFn: () => eventsDB.getLogs(logsProvider, filter, chainId),
    refetchOnWindowFocus: false,
    // The same filter should always return the same logs
    staleTime: Infinity,
    enabled:
      !!logsProvider &&
      !!chainId &&
      !!isLoggedIn &&
      ![filter?.fromBlock, filter?.toBlock, filter?.topics].includes(undefined),
  });

  useEffect(() => {
    if (result.data) console.log(`${name} events`, result.data);
  }, [result.data]);

  return { ...result, isLoading: result.isLoading || loggingIn };
};
