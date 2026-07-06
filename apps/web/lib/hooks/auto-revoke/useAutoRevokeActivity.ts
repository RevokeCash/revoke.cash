import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import { useMemo } from 'react';

// The activity log has two lenses: a member's own approvals, or an entire subscription's approvals
// (owner only). The server returns the full history; the table paginates client-side.
export type ActivityScope = { type: 'address' } | { type: 'subscription'; subscriptionId: string };

const activityPath = (scope: ActivityScope): string =>
  scope.type === 'address'
    ? '/api/auto-revoke/activity'
    : `/api/auto-revoke/subscriptions/${scope.subscriptionId}/activity`;

const activityQueryKey = (scope: ActivityScope) =>
  scope.type === 'address'
    ? (['auto-revoke', 'activity', 'address'] as const)
    : (['auto-revoke', 'activity', 'subscription', scope.subscriptionId] as const);

export const useAutoRevokeActivity = (scope: ActivityScope, enabled: boolean) => {
  const query = useQuery({
    queryKey: activityQueryKey(scope),
    queryFn: () => ky.get(activityPath(scope)).json<AutoRevokeActivityItem[]>(),
    staleTime: MINUTE,
    enabled,
  });

  // We fall back to an empty array because the table crashes if the data is undefined
  // and we use useMemo to prevent the table from infinite re-rendering
  const items = useMemo(() => query.data ?? [], [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
  };
};
