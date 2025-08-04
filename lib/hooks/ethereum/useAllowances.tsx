'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { getTokenPrice } from 'lib/price/utils';
import { isNullish } from 'lib/utils';
import {
  type AllowancePayload,
  AllowanceType,
  type TokenAllowanceData,
  getAllowancesFromEvents,
  stripAllowanceData,
} from 'lib/utils/allowances';
import analytics from 'lib/utils/analytics';
import { type TimeLog, type TokenEvent, getEventKey } from 'lib/utils/events';
import { MINUTE } from 'lib/utils/time';
import { hasZeroBalance } from 'lib/utils/tokens';
import { getSpenderData } from 'lib/utils/whois';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { queryClient } from '../QueryProvider';

interface AllowanceUpdateProperties {
  amount?: bigint;
  lastUpdated?: TimeLog;
}

export const useAllowances = (address: Address, events: TokenEvent[] | undefined, chainId: number) => {
  const publicClient = usePublicClient({ chainId })!;

  // Core allowances query (non-blocking, pricing set to null)
  const { data, isLoading, error } = useQuery<TokenAllowanceData[], Error>({
    queryKey: ['allowances', address, chainId, events?.map(getEventKey)],
    queryFn: async () => {
      const allowances = getAllowancesFromEvents(address, events!, publicClient, chainId);
      analytics.track('Fetched Allowances', { account: address, chainId });
      return allowances;
    },
    // If events (transfers + approvals) don't change, derived allowances also shouldn't change, even if allowances
    // are used on-chain. The only exception would be incorrectly implemented tokens that don't emit correct events
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !isNullish(address) && !isNullish(chainId) && !isNullish(events),
  });

  const [baseAllowances, setBaseAllowances] = useState<TokenAllowanceData[] | undefined>(undefined);

  useLayoutEffect(() => {
    if (data) {
      setBaseAllowances(data);
    }
  }, [data]);

  // No need to deduplicate duplicate unique tokens, since TanStack Query will deduplicate the queries for us
  const priceQueries = useQueries({
    queries: (baseAllowances ?? []).map((allowance) => ({
      queryKey: ['tokenPrice', allowance.chainId, allowance.contract.address],
      queryFn: () => getTokenPrice(allowance.chainId, allowance.contract),
      staleTime: 5 * MINUTE,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
    })),
  });

  // Batch spender queries with 1:1 mapping to baseAllowances (disabled queries for non-spender allowances)
  const spenderQueries = useQueries({
    queries: (baseAllowances ?? []).map((allowance) => ({
      queryKey: ['spenderData', allowance.chainId, allowance.payload?.spender ?? 'null'],
      queryFn: allowance.payload?.spender
        ? () => getSpenderData(allowance.payload!.spender, allowance.chainId)
        : () => null,
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
    })),
  });

  const allowances = useMemo(() => {
    if (!baseAllowances) return undefined;

    return baseAllowances.map((allowance, index) => {
      // Direct indexing for both prices and spenders since the arrays have 1:1 mapping
      const metadata = { ...allowance.metadata, price: priceQueries[index]?.data };
      const payload = allowance.payload
        ? { ...allowance.payload, spenderData: spenderQueries[index]?.data }
        : undefined;

      return { ...allowance, metadata, payload };
    });
  }, [baseAllowances, priceQueries, spenderQueries]);

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
    setBaseAllowances((previousAllowances) => {
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

    setBaseAllowances((previousAllowances) => {
      return previousAllowances!.map((other) => {
        if (!allowanceEquals(other, allowance)) return other;

        const newAllowance = { ...other, payload: { ...other.payload, ...updatedProperties } as AllowancePayload };
        return newAllowance;
      });
    });
  };

  return { allowances, isLoading, error, onUpdate };
};
