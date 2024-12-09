'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { DAY } from 'lib/utils/time';
import type { ReactNode } from 'react';

// Note: the query persister stuff is based on wagmi (https://github.com/wagmi-dev/wagmi/blob/main/packages/react/src/client.ts)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Persisted queries will be refetched every 24 hours
      gcTime: 1 * DAY,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
      retry: 0,
    },
  },
});

if (typeof window !== 'undefined') {
  persistQueryClient({
    queryClient,
    persister: createSyncStoragePersister({ key: 'cache', storage: window.localStorage }),
    dehydrateOptions: {
      // Note: adding a `persist` flag to a query key will instruct the
      // persister whether or not to persist the response of the query.
      shouldDehydrateQuery: (query) => query.gcTime !== 0 && (query.queryKey.at(-1) as any)?.persist,
    },
  });
}

interface Props {
  children: ReactNode;
}

export const QueryProvider = ({ children }: Props) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
