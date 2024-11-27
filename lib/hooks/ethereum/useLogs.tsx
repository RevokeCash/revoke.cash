import { useQuery } from '@tanstack/react-query';
import eventsDB from 'lib/databases/events';
import type { Filter, Log } from 'lib/interfaces';
import { getLogsProvider } from 'lib/providers';
import { useEffect } from 'react';
import { useApiSession } from '../useApiSession';

export const useLogs = (name: string, chainId: number, filter: Filter) => {
  const { isLoggedIn, loggingIn, error: loginError } = useApiSession();

  const result = useQuery<Log[], Error>({
    queryKey: ['logs', filter, chainId, isLoggedIn],
    queryFn: async () => eventsDB.getLogs(getLogsProvider(chainId), filter, chainId),
    refetchOnWindowFocus: false,
    // The same filter should always return the same logs
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !!chainId && !!isLoggedIn && ![filter?.fromBlock, filter?.toBlock, filter?.topics].includes(undefined),
  });

  useEffect(() => {
    if (result.data) console.log(`${name} events`, result.data);
  }, [result.data]);

  const error = loginError ? new Error('Failed to create API session') : result.error;

  return { ...result, isLoading: result.isLoading || loggingIn, error };
};
