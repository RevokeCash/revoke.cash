import { track } from '@amplitude/analytics-browser';
import { useQuery } from '@tanstack/react-query';
import type { AddressEvents, AllowanceData } from 'lib/interfaces';
import { getAllowancesFromEvents, stripAllowanceData } from 'lib/utils/allowances';
import { hasZeroBalance } from 'lib/utils/tokens';
import { useEffect, useState } from 'react';
import { useProvider } from 'wagmi';

export const useAllowances = (address: string, events: AddressEvents, chainId: number) => {
  const [allowances, setAllowances] = useState<AllowanceData[]>();
  const readProvider = useProvider({ chainId });

  const { data, isLoading, error } = useQuery<AllowanceData[], Error>({
    queryKey: ['allowances', address, chainId, events],
    queryFn: async () => {
      if (chainId === undefined || events === undefined) return null;
      const allowances = getAllowancesFromEvents(address, events, readProvider, chainId);
      track('Fetched Allowances', { account: address, chainId });
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

  return { allowances, isLoading, error, onUpdate };
};
