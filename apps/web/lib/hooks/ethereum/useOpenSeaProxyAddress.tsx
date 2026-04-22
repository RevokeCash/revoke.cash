import { isNullish } from '@revoke.cash/core/utils';
import { DAY } from '@revoke.cash/core/utils/time';
import { getOpenSeaProxyAddress } from '@revoke.cash/core/whois';
import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';

export const useOpenSeaProxyAddress = (address: Address) => {
  const { data: openSeaProxyAddress, isLoading } = useQuery({
    queryKey: ['openSeaProxyAddress', address, { persist: true }],
    queryFn: () => getOpenSeaProxyAddress(address),
    enabled: !isNullish(address),
    // This data is very unlikely to ever change
    gcTime: 7 * DAY,
    staleTime: 5 * DAY,
  });

  return { openSeaProxyAddress, isLoading };
};
