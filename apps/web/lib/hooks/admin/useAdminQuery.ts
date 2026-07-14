'use client';

import { MINUTE } from '@revoke.cash/core/utils/time';
import { type keepPreviousData, type QueryKey, useQuery } from '@tanstack/react-query';
import type { Options } from 'ky';
import ky from 'lib/ky';

interface AdminQueryOptions {
  searchParams?: Options['searchParams'];
  enabled?: boolean;
  placeholderData?: typeof keepPreviousData;
}

// All admin queries share the same GET + JSON shape and 1-minute freshness policy
export const useAdminQuery = <T>(queryKey: QueryKey, path: string, options?: AdminQueryOptions) => {
  return useQuery({
    queryKey,
    queryFn: () => ky.get(path, { searchParams: options?.searchParams }).json<T>(),
    staleTime: 1 * MINUTE,
    enabled: options?.enabled,
    placeholderData: options?.placeholderData,
  });
};
