'use client';

import { useQuery } from '@tanstack/react-query';
import { isNullish } from 'lib/utils';
import {
  AllowancePayload,
  AllowanceType,
  getAllowancesFromEvents,
  stripAllowanceData,
  type TokenAllowanceData,
} from 'lib/utils/allowances';
import { analytics } from 'lib/utils/analytics';
import { getEventKey, TimeLog, TokenEvent } from 'lib/utils/events';
import { hasZeroBalance } from 'lib/utils/tokens';
import { useLayoutEffect, useState } from 'react';
import { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { queryClient } from '../QueryProvider';

interface AllowanceUpdateProperties {
  amount?: bigint;
  lastUpdated?: TimeLog;
}

export const useAllowances = (address: Address, events: TokenEvent[] | undefined, chainId: number) => {
  const [allowances, setAllowances] = useState<TokenAllowanceData[]>();
  const publicClient = usePublicClient({ chainId })!;

  const { data, isLoading, error } = useQuery<TokenAllowanceData[], Error>({
    queryKey: ['allowances', address, chainId, events?.map(getEventKey)],
    queryFn: async () => {
      const allowances = getAllowancesFromEvents(address, events!, publicClient, chainId);
      analytics.track('Fetched Allowances', { account: address, chainId });
      return allowances;
    },
    // If events (transfers + approvals) don't change, derived allowances also shouldn't change, even if allowances
    // are used on-chain. The only exception would be incorrectly implemented tokens that don't emit correct events
    staleTime: Infinity,
    enabled: !isNullish(address) && !isNullish(chainId) && !isNullish(events),
  });

  useLayoutEffect(() => {
    if (data) {
      setAllowances(data);
    }
  }, [data]);

  const contractEquals = (a: TokenAllowanceData, b: TokenAllowanceData) => {
    return a.contract.address === b.contract.address && a.chainId === b.chainId;
  };

  const allowanceEquals = (a: TokenAllowanceData, b: TokenAllowanceData) => {
    if (!contractEquals(a, b)) return false;
    if (a.payload?.spender !== b.payload?.spender) return false;
    if (a.payload?.type !== b.payload?.type) return false;
    if (a.payload?.type === AllowanceType.ERC721_SINGLE && b.payload?.type === AllowanceType.ERC721_SINGLE) {
      return a.payload.tokenId === b.payload.tokenId;
    }

    return true;
  };

  const onRevoke = (allowance: TokenAllowanceData) => {
    setAllowances((previousAllowances) => {
      const newAllowances = previousAllowances!.filter((other) => !allowanceEquals(other, allowance));

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

  const onUpdate = async (allowance: TokenAllowanceData, updatedProperties: AllowanceUpdateProperties = {}) => {
    console.debug('Reloading data');

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

    if (!updatedProperties.amount || updatedProperties.amount === 0n) {
      return onRevoke(allowance);
    }

    setAllowances((previousAllowances) => {
      return previousAllowances!.map((other) => {
        if (!allowanceEquals(other, allowance)) return other;

        const newAllowance = { ...other, payload: { ...other.payload, ...updatedProperties } as AllowancePayload };
        return newAllowance;
      });
    });
  };

  return { allowances, isLoading, error, onUpdate };
};
