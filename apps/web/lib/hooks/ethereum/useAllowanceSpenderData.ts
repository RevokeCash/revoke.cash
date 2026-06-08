import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isNullish } from '@revoke.cash/core/utils';
import { useMemo } from 'react';
import { type SpenderDataMap, type SpenderLookup, useSpenderData } from './useSpenderData';

export const useAllowanceSpenderData = (allowances: TokenAllowanceData[]): SpenderDataMap => {
  const spenderLookups = useMemo<SpenderLookup[]>(() => {
    return allowances
      .filter((allowance) => !isNullish(allowance.payload?.spender))
      .map((allowance) => ({
        chainId: allowance.chainId,
        spender: allowance.payload!.spender,
        initialData: allowance.payload!.spenderData,
      }));
  }, [allowances]);

  return useSpenderData(spenderLookups);
};
