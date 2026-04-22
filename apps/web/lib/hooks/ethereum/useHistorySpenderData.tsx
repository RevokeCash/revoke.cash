'use client';

import { type ApprovalTokenEvent, type Enriched, TokenEventType } from '@revoke.cash/core/events';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { useMemo } from 'react';
import type { Address } from 'viem';
import { getSpenderKey, type SpenderLookup, useSpenderData } from './useSpenderData';

const getSpenderAddress = (event: Enriched<ApprovalTokenEvent>): Address => {
  if (event.type === TokenEventType.APPROVAL_ERC721 && event.payload.oldSpender) {
    return event.payload.oldSpender;
  }
  return event.payload.spender;
};

export const useAnnotateHistorySpenderData = (approvalHistory: Enriched<ApprovalTokenEvent>[] | undefined) => {
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
      } as Enriched<ApprovalTokenEvent>;
    });
  }, [approvalHistory, spenderData]);
};
