import { useQuery } from '@tanstack/react-query';
import type { AddressEvents, AllowanceData } from 'lib/interfaces';
import { getAllowancesFromEvents, stripAllowanceData } from 'lib/utils/allowances';
import { track } from 'lib/utils/analytics';
import { hasZeroBalance } from 'lib/utils/tokens';
import { useLayoutEffect, useState } from 'react';
import { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { queryClient } from '../QueryProvider';

export const useAllowances = (address: Address, events: AddressEvents, chainId: number) => {
  const [allowances, setAllowances] = useState<AllowanceData[]>();
  const publicClient = usePublicClient({ chainId });

  const { data, isLoading, error } = useQuery<AllowanceData[], Error>({
    queryKey: ['allowances', address, chainId, events],
    queryFn: async () => {
      const allowances = getAllowancesFromEvents(address, events, publicClient, chainId);
      track('Fetched Allowances', { account: address, chainId });
      return allowances;
    },
    // If events (transfers + approvals) don't change, derived allowances also shouldn't change, even if allowances
    // are used on-chain. The only exception would be incorrectly implemented tokens that don't emit correct events
    staleTime: Infinity,
    enabled: !!address && !!chainId && !!events,
  });

  useLayoutEffect(() => {
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
      const hasBalance = !hasZeroBalance(allowance.balance, allowance.metadata.decimals);
      const wasLastAllowanceForToken = !newAllowances.find((other) => contractEquals(other, allowance));
      if (hasBalance && wasLastAllowanceForToken) {
        newAllowances.push(stripAllowanceData(allowance));
      }

      return newAllowances;
    });
  };

  // TODO: Update last updated time
  const onUpdate = async (allowance: AllowanceData, newAmount?: bigint) => {
    // Invalidate blockNumber query, which triggers a refetch of the events, which in turn triggers a refetch of the allowances
    // We do not immediately refetch the allowances here, but we want to make sure that allowances will be refetched when
    // users navigate to the allowances page again
    await queryClient.invalidateQueries({
      queryKey: ['blockNumber', chainId],
      refetchType: 'none',
    });

    await queryClient.invalidateQueries({
      queryKey: ['walletHealthScore', chainId, allowance.owner],
      refetchType: 'none',
    });

    if (!newAmount || newAmount === 0n) {
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
