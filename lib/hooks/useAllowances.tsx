import { track } from '@amplitude/analytics-browser';
import { useQuery } from '@tanstack/react-query';
import type { AllowanceData } from 'lib/interfaces';
import { getAllowancesForAddress, stripAllowanceData } from 'lib/utils/allowances';
import { hasZeroBalance } from 'lib/utils/tokens';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import { useEffect, useState } from 'react';
import { useEthereum } from './useEthereum';

export const useAllowances = (userAddress: string) => {
  const [allowances, setAllowances] = useState<AllowanceData[]>();

  const { readProvider, logsProvider, selectedChainId } = useEthereum();

  // When changing networks, we need to make sure that the *readProvider* is set to the *connectedProvider* if it's not already
  // TODO: This is super hacky and I hate it, would love to move everything over to wagmi.sh and hopefully get rid of this
  const [safeChainId, setSafeChainId] = useState<number>();
  useEffect(() => {
    const updateSafeChainId = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setSafeChainId(selectedChainId);
    };

    if (selectedChainId && selectedChainId !== safeChainId) {
      updateSafeChainId();
    }
  }, [selectedChainId, safeChainId]);

  // This is required because we need to get the OpenSea proxy address before we can get the allowances (due to Moonbirds patches)
  const { data: openSeaProxyAddress, isLoading: openSeaProxyLoading } = useQuery({
    queryKey: ['openSeaProxyAddress', userAddress],
    queryFn: () => getOpenSeaProxyAddress(userAddress),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const { data, isLoading, error } = useQuery<AllowanceData[], Error>({
    queryKey: ['allowances', userAddress, safeChainId, openSeaProxyAddress, openSeaProxyLoading],
    queryFn: async () => {
      if (openSeaProxyLoading || safeChainId === undefined) return null;
      const allowances = getAllowancesForAddress(
        userAddress,
        logsProvider,
        readProvider,
        safeChainId,
        openSeaProxyAddress
      );
      track('Fetched Allowances', { account: userAddress, chainId: safeChainId });
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

  const contractEquals = (a: AllowanceData, b: AllowanceData) => {
    return a.contract.address === b.contract.address;
  };

  const allowanceEquals = (a: AllowanceData, b: AllowanceData) => {
    return contractEquals(a, b) && a.spender === b.spender && a.tokenId === b.tokenId;
  };

  const onRevoke = (allowance: AllowanceData) => {
    setAllowances((previousAllowances) => {
      const newAllowances = previousAllowances.filter((other) => !allowanceEquals(other, allowance));

      // If the token has a balance and we just revoked the last allowance, we need to add the token back to the list
      // TODO: This is kind of ugly, ideally this should be reactive
      if (!hasZeroBalance(allowance) && !newAllowances.find((other) => contractEquals(other, allowance))) {
        newAllowances.push(stripAllowanceData(allowance));
      }

      return newAllowances;
    });
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
