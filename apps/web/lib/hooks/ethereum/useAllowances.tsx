'use client';

import { useQuery } from '@tanstack/react-query';
import { deduplicateArray, isNullish } from 'lib/utils';
import {
  type AllowanceUpdateProperties,
  applyRevokeToAllowances,
  applyUpdateToAllowances,
  getAllowancesFromEvents,
  type TokenAllowanceData,
} from 'lib/utils/allowances';
import analytics from 'lib/utils/analytics';
import { type EnrichedTokenEvent, getEventKey } from 'lib/utils/events';
import { isErc721Contract } from 'lib/utils/tokens';
import { useEffect, useMemo, useState } from 'react';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { queryClient } from '../QueryProvider';
import { useAllowanceSpenderData } from './useAllowanceSpenderData';
import { getPriceKey, usePriceData } from './usePriceData';
import { getSpenderKey } from './useSpenderData';

export const useAllowances = (address: Address, events: EnrichedTokenEvent[] | undefined, chainId: number) => {
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

  useEffect(() => {
    if (data) {
      setBaseAllowances(data.filter((allowance) => !isNullish(allowance.payload)));
    }
  }, [data]);

  const uniqueErc20TokenAddresses = useMemo(() => {
    const erc20Addresses = (baseAllowances ?? [])
      .filter((allowance) => !isErc721Contract(allowance.contract))
      .map((allowance) => allowance.contract.address);

    return [{ chainId, addresses: deduplicateArray(erc20Addresses).sort() }];
  }, [baseAllowances, chainId]);

  const priceData = usePriceData(uniqueErc20TokenAddresses);

  const spenderData = useAllowanceSpenderData(baseAllowances ?? []);

  const allowances = useMemo(() => {
    if (!baseAllowances) return undefined;

    return baseAllowances.map((allowance) => {
      const priceKey = getPriceKey(allowance.chainId, allowance.contract.address);
      const tokenPrice = isErc721Contract(allowance.contract) ? null : priceData[priceKey];
      const metadata = { ...allowance.metadata, price: tokenPrice };

      const spenderKey = getSpenderKey(allowance.chainId, allowance.payload!.spender);
      const payload = allowance.payload ? { ...allowance.payload, spenderData: spenderData[spenderKey] } : undefined;

      return { ...allowance, metadata, payload };
    });
  }, [baseAllowances, priceData, spenderData]);

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
