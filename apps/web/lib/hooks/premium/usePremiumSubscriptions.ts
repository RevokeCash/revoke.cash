import type { PremiumEntitlement, PremiumSubscription } from '@revoke.cash/core/premium/types';
import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { Address } from 'viem';

interface SubscriptionsResponse {
  subscriptions: PremiumSubscription[];
  entitlements: PremiumEntitlement[];
}

export const getSubscriptionsQueryKey = (ownerAddress: Address) => ['premium', 'subscriptions', ownerAddress] as const;

export const usePremiumSubscriptions = (ownerAddress: Address, enabled: boolean) => {
  const query = useQuery({
    queryKey: getSubscriptionsQueryKey(ownerAddress),
    queryFn: async () => {
      return ky.get('/api/premium/subscriptions/me').json<SubscriptionsResponse>();
    },
    enabled,
  });

  return {
    subscriptions: query.data?.subscriptions ?? [],
    entitlements: query.data?.entitlements ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
