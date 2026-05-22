'use client';

import type { OnUpdate, TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { EnrichedTokenEvent, TokenEvent } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { useMemo } from 'react';
import type { Address } from 'viem';
import { useEvents } from './events/useEvents';
import { useAllowances } from './useAllowances';

export interface AddressData {
  state: {
    computedAt: string | null;
    computedToBlock: number | null;
  };
  allowances: TokenAllowanceData[];
  events: EnrichedTokenEvent[];
}

interface UseAddressDataResult {
  data: AddressData | undefined;
  events: EnrichedTokenEvent[] | undefined;
  rawEvents: TokenEvent[] | undefined;
  allowances: TokenAllowanceData[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onUpdate: OnUpdate;
  eventContext: ReturnType<typeof useEvents>;
  allowanceContext: ReturnType<typeof useAllowances>;
}

export const useAddressData = (address: Address, chainId: number): UseAddressDataResult => {
  const eventContext = useEvents(address, chainId);
  const allowanceContext = useAllowances(address, eventContext.events, chainId);

  const error = allowanceContext.error || eventContext.error || null;
  const isLoading =
    (allowanceContext.isLoading || eventContext.isLoading || isNullish(allowanceContext.allowances)) && !error;

  const data = useMemo<AddressData | undefined>(() => {
    if (isNullish(eventContext.events) || isNullish(allowanceContext.allowances)) return undefined;

    return {
      state: eventContext.state ?? { computedAt: null, computedToBlock: null },
      allowances: allowanceContext.allowances,
      events: eventContext.events,
    };
  }, [allowanceContext.allowances, eventContext.events, eventContext.state]);

  return {
    data,
    events: data?.events,
    rawEvents: eventContext.rawEvents,
    allowances: data?.allowances,
    isLoading,
    error,
    onUpdate: allowanceContext.onUpdate,
    eventContext,
    allowanceContext: {
      ...allowanceContext,
      allowances: allowanceContext.allowances,
      isLoading,
      error,
    },
  };
};
