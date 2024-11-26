import { useQuery } from '@tanstack/react-query';
import { HOUR } from 'lib/utils/time';
import { lookupAvvyName, lookupEnsName, lookupUnsName } from 'lib/utils/whois';
import type { Address } from 'viem';

export const useNameLookup = (address: Address) => {
  const { data: ensName } = useQuery({
    queryKey: ['ensName', address, { persist: true }],
    queryFn: () => lookupEnsName(address),
    enabled: !!address,
    staleTime: 12 * HOUR,
  });

  const { data: unsName } = useQuery({
    queryKey: ['unsName', address, { persist: true }],
    queryFn: () => lookupUnsName(address),
    enabled: !!address,
    staleTime: 12 * HOUR,
  });

  const { data: avvyName } = useQuery<string>({
    queryKey: ['avvyName', address, { persist: true }],
    queryFn: () => lookupAvvyName(address),
    enabled: !!address,
    staleTime: 12 * HOUR,
  });

  return {
    ensName,
    unsName,
    avvyName,
    domainName: ensName || unsName || avvyName,
  };
};
