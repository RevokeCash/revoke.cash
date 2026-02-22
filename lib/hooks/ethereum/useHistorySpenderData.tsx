'use client';

import { useQueries } from '@tanstack/react-query';
import type { ApprovalHistoryEvent } from 'components/history/utils';
import type { Nullable, SpenderRiskData } from 'lib/interfaces';
import { getSpenderData } from 'lib/utils/whois';
import { useMemo } from 'react';
import type { Address } from 'viem';

const getSpenderAddress = (event: ApprovalHistoryEvent): Address => {
  return ('oldSpender' in event.payload ? event.payload.oldSpender : event.payload.spender) as Address;
};

const getSpenderKey = (chainId: number, spender: Address): string => {
  return `${chainId}-${spender.toLowerCase()}`;
};

interface UniqueSpenderLookup {
  chainId: number;
  spender: Address;
  key: string;
}

const withSpenderData = (event: ApprovalHistoryEvent, spenderData: Nullable<SpenderRiskData>): ApprovalHistoryEvent => {
  return { ...event, payload: { ...event.payload, spenderData } } as ApprovalHistoryEvent;
};

export const useHistorySpenderData = (approvalHistory: ApprovalHistoryEvent[] | undefined) => {
  const uniqueSpenderLookups = useMemo<UniqueSpenderLookup[]>(() => {
    if (!approvalHistory || approvalHistory.length === 0) return [];

    const uniqueMap = new Map<string, UniqueSpenderLookup>();
    approvalHistory.forEach((event) => {
      const spender = getSpenderAddress(event);
      const key = getSpenderKey(event.chainId, spender);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, { chainId: event.chainId, spender, key });
      }
    });

    return Array.from(uniqueMap.values());
  }, [approvalHistory]);

  const spenderQueries = useQueries({
    queries: uniqueSpenderLookups.map((lookup) => ({
      queryKey: ['spenderData', lookup.chainId, lookup.spender],
      queryFn: () => getSpenderData(lookup.spender, lookup.chainId),
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
    })),
  });

  const spenderDataMap = useMemo(() => {
    const map = new Map<string, Nullable<SpenderRiskData>>();

    uniqueSpenderLookups.forEach((lookup, index) => {
      map.set(lookup.key, (spenderQueries[index]?.data as Nullable<SpenderRiskData>) ?? null);
    });

    return map;
  }, [uniqueSpenderLookups, spenderQueries]);

  return useMemo(() => {
    if (!approvalHistory) return undefined;

    return approvalHistory.map((event) => {
      const spender = getSpenderAddress(event);
      const spenderKey = getSpenderKey(event.chainId, spender);
      const spenderData = spenderDataMap.get(spenderKey) ?? null;
      return withSpenderData(event, spenderData);
    });
  }, [approvalHistory, spenderDataMap]);
};
