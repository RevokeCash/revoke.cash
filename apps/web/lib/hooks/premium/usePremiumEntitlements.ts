import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { Address } from 'viem';

interface EntitlementResponse {
  isPremium: boolean;
  isUltimate: boolean;
}

export const getPremiumEntitlementsQueryKey = (address?: Address) => ['premium', 'entitlements', address] as const;

export const usePremiumEntitlements = (address: Address | undefined, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: getPremiumEntitlementsQueryKey(address),
    queryFn: async () => {
      return await ky.get(`/api/premium/entitlements/${address}`).json<EntitlementResponse>();
    },
    enabled: enabled && !isNullish(address),
  });

  return {
    isPremium: query.data?.isPremium ?? false,
    isUltimate: query.data?.isUltimate ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
