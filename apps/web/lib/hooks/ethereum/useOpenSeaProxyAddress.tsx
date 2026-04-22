import { useQuery } from '@tanstack/react-query';
import { isNullish } from 'lib/utils';
import { DAY } from 'lib/utils/time';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
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
