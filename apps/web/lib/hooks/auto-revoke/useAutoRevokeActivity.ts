import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import { isNullish } from '@revoke.cash/core/utils';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import ky from 'lib/ky';
import { useMemo } from 'react';
import type { Address } from 'viem';

// The activity log has two lenses: a member's own approvals, or an entire subscription's approvals
// (owner only). The server returns the full history; the table paginates client-side.
export type ActivityScope = { type: 'address' } | { type: 'subscription'; subscriptionId: string };

const activityPath = (scope: ActivityScope): string =>
  scope.type === 'address'
    ? '/api/auto-revoke/activity'
    : `/api/auto-revoke/subscriptions/${scope.subscriptionId}/activity`;

// The address-scoped endpoint derives the wallet from the SIWE session
const activityQueryKey = (scope: ActivityScope, siweAddress: Address | null) =>
  scope.type === 'address'
    ? (['auto-revoke', 'activity', 'address', siweAddress] as const)
    : (['auto-revoke', 'activity', 'subscription', scope.subscriptionId] as const);

export const useAutoRevokeActivity = (scope: ActivityScope, enabled: boolean) => {
  const { siweAddress } = useAuthSession();

  const query = useQuery({
    queryKey: activityQueryKey(scope, siweAddress),
    queryFn: () => ky.get(activityPath(scope)).json<AutoRevokeActivityItem[]>(),
    staleTime: MINUTE,
    enabled: enabled && (scope.type !== 'address' || !isNullish(siweAddress)),
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
