import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { PremiumSubscription } from 'lib/premium/types';
import type { Address } from 'viem';

export const getSubscriptionsQueryKey = (ownerAddress: Address) => ['premium', 'subscriptions', ownerAddress] as const;

export const usePremiumSubscriptions = (ownerAddress: Address, enabled: boolean) => {
  const query = useQuery({
    queryKey: getSubscriptionsQueryKey(ownerAddress),
    queryFn: async () => {
      const response = await ky.get('/api/premium/subscriptions/me').json<{ subscriptions: PremiumSubscription[] }>();
      return response.subscriptions;
    },
    enabled,
  });

  return {
    subscriptions: query.data ?? [],
    isLoading: query.isLoading,
    isAnyActive: Boolean(query.data?.some((subscription) => subscription.isActive)),
  };
};
