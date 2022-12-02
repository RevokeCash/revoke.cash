import { useQuery } from '@tanstack/react-query';
import type { AllowanceData } from 'lib/interfaces';
import { getAllowancesForAddress } from 'lib/utils/allowances';
import { useEffect, useState } from 'react';
import { useAppContext } from './useAppContext';
import { useEthereum } from './useEthereum';

export const useAllowances = (userAddress: string) => {
  const [allowances, setAllowances] = useState<AllowanceData[]>();

  const { tokenMapping } = useAppContext();
  const { readProvider, logsProvider, selectedChainId } = useEthereum();

  const { data, isLoading, error } = useQuery<AllowanceData[], Error>({
    queryKey: ['allowances', userAddress, selectedChainId],
    queryFn: () => getAllowancesForAddress(userAddress, logsProvider, readProvider, tokenMapping),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
    cacheTime: Infinity,
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

  return { allowances, loading: isLoading, error, onUpdate };
};
