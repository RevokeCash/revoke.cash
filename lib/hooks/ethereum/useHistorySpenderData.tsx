'use client';

import type { ApprovalHistoryEvent } from 'components/history/utils';
import { deduplicateArray } from 'lib/utils';
import { useMemo } from 'react';
import type { Address } from 'viem';
import { getSpenderKey, type SpenderLookup, useSpenderData } from './useSpenderData';

const getSpenderAddress = (event: ApprovalHistoryEvent): Address => {
  return ('oldSpender' in event.payload ? event.payload.oldSpender : event.payload.spender) as Address;
};

export const useAnnotateHistorySpenderData = (approvalHistory: ApprovalHistoryEvent[] | undefined) => {
  const uniqueSpenders = useMemo<SpenderLookup[]>(() => {
    if (!approvalHistory || approvalHistory.length === 0) return [];
    const spenderLookups = approvalHistory.map((event) => ({
      chainId: event.chainId,
      spender: getSpenderAddress(event),
    }));
    return deduplicateArray(spenderLookups, (spender) => getSpenderKey(spender.chainId, spender.spender));
  }, [approvalHistory]);

  const spenderData = useSpenderData(uniqueSpenders);

  return useMemo(() => {
    if (!approvalHistory) return undefined;

    return approvalHistory.map((event) => {
      const spender = getSpenderAddress(event);
      const spenderKey = getSpenderKey(event.chainId, spender);
      return {
        ...event,
        payload: { ...event.payload, spenderData: spenderData[spenderKey] },
      } as ApprovalHistoryEvent;
    });
  }, [approvalHistory, spenderData]);
};
