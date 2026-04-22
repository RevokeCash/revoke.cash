import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { Address } from 'viem';

interface EntitlementResponse {
  isPremium: boolean;
}

export const getPremiumEntitlementsQueryKey = (address?: Address) => ['premium', 'entitlements', address] as const;

export const usePremiumEntitlements = (address: Address | undefined, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: getPremiumEntitlementsQueryKey(address),
    queryFn: async () => {
      const res = await ky.get(`/api/premium/entitlements/${address}`).json<EntitlementResponse>();
      console.log('res', res);
      return res;
    },
    enabled: enabled && !isNullish(address),
  });

  return {
    isPremium: query.data?.isPremium ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
