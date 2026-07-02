'use client';

import {
  type AllowanceUpdateProperties,
  applyRevokeToAllowances,
  applyUpdateToAllowances,
  getAllowancesFromEvents,
  type TokenAllowanceData,
} from '@revoke.cash/core/allowances';
import { type EnrichedTokenEvent, getEventKey } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import analytics from 'lib/utils/analytics';
import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { queryClient } from '../QueryProvider';
import { useEnrichAllowances } from './useEnrichAllowances';

export const useAllowances = (address: Address, events: EnrichedTokenEvent[] | undefined, chainId: number) => {
  const publicClient = usePublicClient({ chainId })!;

  // Core allowances query (non-blocking, pricing set to null)
  const { data, isLoading, error } = useQuery<TokenAllowanceData[], Error>({
    queryKey: ['allowances', address, chainId, events?.map(getEventKey)],
    queryFn: async () => {
      const allowances = await getAllowancesFromEvents(address, events!, publicClient, chainId, {
        transferEventsAvailable: false,
      });
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
      setBaseAllowances(data);
    }
  }, [data]);

  const [enrichedAllowances = []] = useEnrichAllowances({
    owner: address,
    chainAllowances: [{ chainId, allowances: baseAllowances ?? [] }],
  });
  const allowances = baseAllowances ? enrichedAllowances : undefined;

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
