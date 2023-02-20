import { track } from '@amplitude/analytics-browser';
import { useQuery } from '@tanstack/react-query';
import type { AllowanceData } from 'lib/interfaces';
import { getAllowancesForAddress, stripAllowanceData } from 'lib/utils/allowances';
import { hasZeroBalance } from 'lib/utils/tokens';
import { useEffect, useState } from 'react';
import { useProvider } from 'wagmi';
import { useAddressPageContext } from './useAddressContext';

export const useAllowances = (userAddress: string) => {
  const [allowances, setAllowances] = useState<AllowanceData[]>();
  const { selectedChainId, logsProvider, openSeaProxyAddress, isLoading: isAddressLoading } = useAddressPageContext();
  const readProvider = useProvider({ chainId: selectedChainId });

  const { data, isLoading, error } = useQuery<AllowanceData[], Error>({
    queryKey: ['allowances', userAddress, readProvider?.network?.chainId, openSeaProxyAddress, isAddressLoading],
    queryFn: async () => {
      if (isAddressLoading || readProvider?.network?.chainId === undefined) return null;
      const allowances = getAllowancesForAddress(
        userAddress,
        logsProvider,
        readProvider,
        readProvider?.network?.chainId,
        openSeaProxyAddress
      );
      track('Fetched Allowances', { account: userAddress, chainId: readProvider?.network?.chainId });
      return allowances;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
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

  return { allowances, loading: isLoading || isAddressLoading, error, onUpdate };
};
