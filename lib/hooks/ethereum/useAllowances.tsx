'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { getTokenPrice } from 'lib/price/utils';
import { isNullish } from 'lib/utils';
import {
  type AllowanceUpdateProperties,
  applyRevokeToAllowances,
  applyUpdateToAllowances,
  getAllowancesFromEvents,
  type TokenAllowanceData,
} from 'lib/utils/allowances';
import analytics from 'lib/utils/analytics';
import { getEventKey, type TokenEvent } from 'lib/utils/events';
import { MINUTE } from 'lib/utils/time';
import { getSpenderData } from 'lib/utils/whois';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { queryClient } from '../QueryProvider';

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

  // When the chainId changes, we reset the allowances, so it doesn't keep old allowances for the previous chain while loading
  // biome-ignore lint/correctness/useExhaustiveDependencies(chainId): We want this to re-run when chainId changes
  useEffect(() => {
    setBaseAllowances(undefined);
  }, [chainId]);

  useLayoutEffect(() => {
    if (data) {
      setBaseAllowances(data);
    }
  }, [data]);

  // No need to deduplicate duplicate unique tokens/spenders, since TanStack Query will deduplicate the queries for us
  const priceQueries = useQueries({
    queries: (baseAllowances ?? []).map((allowance) => ({
      queryKey: ['tokenPrice', allowance.chainId, allowance.contract.address],
      queryFn: () => getTokenPrice(allowance.chainId, allowance.contract),
      staleTime: 5 * MINUTE,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
    })),
  });

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

  const onUpdate = async (allowance: TokenAllowanceData, updatedProperties: AllowanceUpdateProperties = {}) => {
    console.debug('Reloading data');

    // Invalidate blockNumber query, which triggers a refetch of the events, which in turn triggers a refetch of the allowances
    // We do not immediately refetch the allowances here, but we want to make sure that allowances will be refetched when
    // users navigate to the allowances page again
    await queryClient.invalidateQueries({
      queryKey: ['blockNumber', chainId],
      refetchType: 'none',
    });

    // Update in-memory state immediately
    if (!updatedProperties.amount || updatedProperties.amount === 0n) {
      setBaseAllowances((prev) => (prev ? applyRevokeToAllowances(prev, allowance) : prev));
    } else {
      setBaseAllowances((prev) => (prev ? applyUpdateToAllowances(prev, allowance, updatedProperties) : prev));
    }
  };

  return { allowances, isLoading, error, onUpdate };
};
