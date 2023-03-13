import { useQuery } from '@tanstack/react-query';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';

export const useOpenSeaProxyAddress = (address: string) => {
  const { data: openSeaProxyAddress, isLoading } = useQuery({
    queryKey: ['openSeaProxyAddress', address, { persist: true }],
    queryFn: () => getOpenSeaProxyAddress(address),
  });

  return { openSeaProxyAddress, isLoading };
};
