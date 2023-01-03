import { track } from '@amplitude/analytics-browser';
import { useQuery } from '@tanstack/react-query';
import type { AllowanceData } from 'lib/interfaces';
import { getAllowancesForAddress } from 'lib/utils/allowances';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import { useEffect, useState } from 'react';
import { useEthereum } from './useEthereum';

export const useAllowances = (userAddress: string) => {
  const [allowances, setAllowances] = useState<AllowanceData[]>();

  const { readProvider, logsProvider, selectedChainId } = useEthereum();

  // This is required because we need to get the OpenSea proxy address before we can get the allowances (due to Moonbirds patches)
  // This can be improved, but at the same time, this also means that the "readProvider" has had the time to be set to connectedProvider if needed
  // TODO: Hopefully move to wagmi-sh at some point and remove hacky stuff like this
  const { data: openSeaProxyAddress, isLoading: openSeaProxyLoading } = useQuery({
    queryKey: ['openSeaProxyAddress', userAddress],
    queryFn: () => getOpenSeaProxyAddress(userAddress),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const { data, isLoading, error } = useQuery<AllowanceData[], Error>({
    queryKey: ['allowances', userAddress, selectedChainId, openSeaProxyAddress, openSeaProxyLoading],
    queryFn: async () => {
      if (openSeaProxyLoading) return [];
      const allowances = getAllowancesForAddress(userAddress, logsProvider, readProvider, openSeaProxyAddress);
      track('Fetched Allowances', { account: userAddress, chainId: selectedChainId });
      return allowances;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
    cacheTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setAllowances(data);
    }
  }, [data]);

  const allowanceEquals = (a: AllowanceData, b: AllowanceData) => {
    return a.contract.address === b.contract.address && a.spender === b.spender && a.tokenId === b.tokenId;
  };

  const onRevoke = (allowance: AllowanceData) => {
    setAllowances((previousAllowances) => previousAllowances.filter((other) => !allowanceEquals(other, allowance)));
  };

  // TODO: Update last updated time
  const onUpdate = (allowance: AllowanceData, newAmount?: string) => {
    if (!newAmount || newAmount === '0') {
      return onRevoke(allowance);
    }

    setAllowances((previousAllowances) => {
      return previousAllowances.map((other) => {
        if (!allowanceEquals(other, allowance)) return other;

        const newAllowance = { ...other, amount: newAmount };
        return newAllowance;
      });
    });
  };

  return { allowances, loading: isLoading || openSeaProxyLoading, error, onUpdate };
};
