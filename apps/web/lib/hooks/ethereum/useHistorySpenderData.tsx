'use client';

import { type ApprovalTokenEvent, type Enriched, TokenEventType } from '@revoke.cash/core/events';
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
  const spenderLookups = useMemo<SpenderLookup[]>(() => {
    if (!approvalHistory || approvalHistory.length === 0) return [];

    return approvalHistory.map((event) => {
      const spender = getSpenderAddress(event);
      return { chainId: event.chainId, spender, initialData: event.payload.spenderData };
    });
  }, [approvalHistory]);

  const spenderData = useSpenderData(spenderLookups);

  return useMemo(() => {
    if (!approvalHistory) return undefined;

    return approvalHistory.map((event) => {
      if (event.payload.spenderData !== undefined) return event;

      const spender = getSpenderAddress(event);
      const spenderKey = getSpenderKey(event.chainId, spender);
      return {
        ...event,
        payload: { ...event.payload, spenderData: spenderData[spenderKey] },
      } as Enriched<ApprovalTokenEvent>;
    });
  }, [approvalHistory, spenderData]);
};
