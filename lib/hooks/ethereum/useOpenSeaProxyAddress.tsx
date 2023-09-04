import { useQuery } from '@tanstack/react-query';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import { Address } from 'viem';

export const useOpenSeaProxyAddress = (address: Address) => {
  const { data: openSeaProxyAddress, isLoading } = useQuery({
    queryKey: ['openSeaProxyAddress', address, { persist: true }],
    queryFn: () => getOpenSeaProxyAddress(address),
    enabled: !!address,
  });

  return { openSeaProxyAddress, isLoading };
};
