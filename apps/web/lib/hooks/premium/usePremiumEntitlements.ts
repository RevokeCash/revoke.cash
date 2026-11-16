import type { EntitlementSummary } from '@revoke.cash/core/premium/entitlements';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { Address } from 'viem';

export const getPremiumEntitlementsQueryKey = (address?: Address) => ['premium', 'entitlements', address] as const;

export const usePremiumEntitlements = (address: Address | undefined, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: getPremiumEntitlementsQueryKey(address),
    queryFn: async () => {
      return await ky.get(`/api/premium/entitlements/${address}`).json<EntitlementSummary>();
    },
    enabled: enabled && !isNullish(address),
  });

  return {
    isPremium: query.data?.isPremium ?? false,
    isUltimate: query.data?.isUltimate ?? false,
    ownTier: query.data?.ownTier ?? null,
    grantedTier: query.data?.grantedTier ?? null,
    ownEndsAt: query.data?.ownEndsAt ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
