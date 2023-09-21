import { useQuery } from '@tanstack/react-query';
import { DAY } from 'lib/utils/time';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import { Address } from 'viem';

export const useOpenSeaProxyAddress = (address: Address) => {
  const { data: openSeaProxyAddress, isLoading } = useQuery({
    queryKey: ['openSeaProxyAddress', address, { persist: true }],
    queryFn: () => getOpenSeaProxyAddress(address),
    enabled: !!address,
    // This data is very unlikely to ever change
    cacheTime: 7 * DAY,
    staleTime: 5 * DAY,
  });

  return { openSeaProxyAddress, isLoading };
};
