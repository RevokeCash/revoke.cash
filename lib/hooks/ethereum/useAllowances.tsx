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

const PRICE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useAllowances = (address: Address, events: TokenEvent[] | undefined, chainId: number) => {
  const [allowances, setAllowances] = useState<TokenAllowanceData[]>();
  const publicClient = usePublicClient({ chainId })!;

  // Core allowances query(non-blocking set to null)
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

  const uniqueContracts = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return data.filter((allowance) => {
      const key = `${allowance.chainId}-${allowance.contract.address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data]);

  const uniqueSpenders = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return data
      .filter((allowance) => allowance.payload?.spender)
      .filter((allowance) => {
        const key = `${allowance.chainId}-${allowance.payload!.spender}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [data]);

  const priceQueries = useQueries({
    queries: uniqueContracts.map((allowance) => ({
      queryKey: ['tokenPrice', allowance.chainId, allowance.contract.address],
      queryFn: () => getTokenPrice(allowance.chainId, allowance.contract),
      staleTime: PRICE_STALE_TIME,
      refetchOnWindowFocus: false,
      placeholderData: null,
    })),
  });

  // Batch spender queries for all unique spenders
  const spenderQueries = useQueries({
    queries: uniqueSpenders.map((allowance) => ({
      queryKey: ['spenderData', allowance.payload!.spender, allowance.chainId],
      queryFn: () => getSpenderData(allowance.payload!.spender, allowance.chainId),
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
    })),
  });

  // Create lookup maps for efficient data merging
  const priceMap = useMemo(() => {
    const map = new Map<string, number | null>();
    uniqueContracts.forEach((allowance, index) => {
      const key = `${allowance.chainId}-${allowance.contract.address}`;
      map.set(key, priceQueries[index]?.data ?? null);
    });
    return map;
  }, [uniqueContracts, priceQueries]);

  const spenderMap = useMemo(() => {
    const map = new Map<string, any>();
    uniqueSpenders.forEach((allowance, index) => {
      const key = `${allowance.chainId}-${allowance.payload!.spender}`;
      map.set(key, spenderQueries[index]?.data);
    });
    return map;
  }, [uniqueSpenders, spenderQueries]);

  // Merge async data with allowances reactively
  const enhancedAllowances = useMemo(() => {
    if (!data) return undefined;

    return data.map((allowance) => {
      const priceKey = `${allowance.chainId}-${allowance.contract.address}`;
      const spenderKey = allowance.payload?.spender ? `${allowance.chainId}-${allowance.payload.spender}` : null;

      const price = priceMap.get(priceKey) ?? null;
      const spenderData = spenderKey ? spenderMap.get(spenderKey) : undefined;

      return {
        ...allowance,
        metadata: {
          ...allowance.metadata,
          price,
        },
        spenderData, // Add spender data for sorting/filtering
      };
    });
  }, [data, priceMap, spenderMap]);

  useLayoutEffect(() => {
    if (enhancedAllowances) {
      setAllowances(enhancedAllowances);
    }
  }, [enhancedAllowances]);

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
