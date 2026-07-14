'use client';

import type { AdminActivityItem } from '@revoke.cash/core/admin/activity';
import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { keepPreviousData } from '@tanstack/react-query';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';

interface AdminActivityParams {
  address?: string;
  subscriptionId?: string;
  chainIds?: number[];
  statuses?: ActionStatus[];
  page: number;
  pageSize: number;
}

interface AdminActivityResponse {
  items: AdminActivityItem[];
  totalCount: number;
}

const ADMIN_ACTIVITY_QUERY_KEY = ['admin', 'activity'];

export const useAdminActivity = (params: AdminActivityParams) => {
  const { chainIds, statuses, ...scalarParams } = params;

  // Sorted before joining so the query key stays stable regardless of selection order
  const serializedChainIds =
    chainIds && chainIds.length > 0 ? [...chainIds].sort((left, right) => left - right).join(',') : undefined;
  const serializedStatuses = statuses && statuses.length > 0 ? [...statuses].sort().join(',') : undefined;

  const searchParams = Object.fromEntries(
    Object.entries({ ...scalarParams, chainIds: serializedChainIds, statuses: serializedStatuses })
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );

  return useAdminQuery<AdminActivityResponse>([...ADMIN_ACTIVITY_QUERY_KEY, searchParams], '/api/admin/activity', {
    searchParams,
    placeholderData: keepPreviousData,
  });
};
