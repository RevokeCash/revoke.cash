import { track } from '@amplitude/analytics-browser';
import { useQuery } from '@tanstack/react-query';
import type { AddressEvents, AllowanceData } from 'lib/interfaces';
import { getAllowancesFromEvents, stripAllowanceData } from 'lib/utils/allowances';
import { hasZeroBalance } from 'lib/utils/tokens';
import { useEffect, useState } from 'react';
import { useProvider } from 'wagmi';
import { queryClient } from '../QueryProvider';

export const useAllowances = (address: string, events: AddressEvents, chainId: number) => {
  const [allowances, setAllowances] = useState<AllowanceData[]>();
  const readProvider = useProvider({ chainId });

  const { data, isLoading, error } = useQuery<AllowanceData[], Error>({
    queryKey: ['allowances', address, chainId, events],
    queryFn: async () => {
      if (!chainId || !events) return null;
      const allowances = getAllowancesFromEvents(address, events, readProvider, chainId);
      track('Fetched Allowances', { account: address, chainId });
      return allowances;
    },
    // If events (transfers + approvals) don't change, derived allowances also shouldn't change, even if allowances
    // are used on-chain. The only exception would be incorrectly implemented tokens that don't emit correct events
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) {
      setAllowances(data);
    }
  }, [data]);

  const contractEquals = (a: AllowanceData, b: AllowanceData) => {
    return a.contract.address === b.contract.address && a.chainId === b.chainId;
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
  const onUpdate = async (allowance: AllowanceData, newAmount?: string) => {
    // Invalidate blockNumber query, which triggers a refetch of the events, which in turn triggers a refetch of the allowances
    // We do not immediately refetch the allowances here, but we want to make sure that allowances will be refetched when
    // users navigate to the allowances page again
    await queryClient.invalidateQueries({
      queryKey: ['blockNumber', chainId],
      refetchType: 'none',
    });

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
