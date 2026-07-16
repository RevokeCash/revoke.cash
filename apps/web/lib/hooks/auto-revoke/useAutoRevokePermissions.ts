import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { Address } from 'viem';

const getAddressPermissionsQueryKey = (address: Address) => ['auto-revoke', 'permissions', address] as const;

const getSubscriptionPermissionsQueryKey = (subscriptionId?: string) =>
  ['auto-revoke', 'subscription-permissions', subscriptionId] as const;

export const useAddressAutoRevokePermissions = (address: Address, enabled: boolean) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: getAddressPermissionsQueryKey(address),
    queryFn: async () => ky.get('/api/auto-revoke/permissions').json<AutoRevokePermission[]>(),
    enabled,
  });

  return {
    permissions: data ?? [],
    isLoading,
    isError,
  };
};

export const useSubscriptionAutoRevokePermissions = (subscriptionId: string | undefined, enabled: boolean) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: getSubscriptionPermissionsQueryKey(subscriptionId),
    queryFn: async () =>
      ky.get(`/api/auto-revoke/subscriptions/${subscriptionId}/permissions`).json<AutoRevokePermission[]>(),
    enabled: enabled && !isNullish(subscriptionId),
  });

  return {
    permissions: data ?? [],
    isLoading,
    isError,
  };
};
