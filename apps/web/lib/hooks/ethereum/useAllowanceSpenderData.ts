import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import { useMemo } from 'react';
import { type SpenderDataMap, type SpenderLookup, useSpenderData } from './useSpenderData';

export const useAllowanceSpenderData = (allowances: TokenAllowanceData[]): SpenderDataMap => {
  const spenderLookups = useMemo<SpenderLookup[]>(() => {
    return allowances.map((allowance) => ({
      chainId: allowance.chainId,
      spender: allowance.payload.spender,
      initialData: allowance.payload.spenderData,
    }));
  }, [allowances]);

  return useSpenderData(spenderLookups);
};
