import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Nullable } from '@revoke.cash/core/types';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import type { SpenderData, SpenderRiskData } from '@revoke.cash/core/whois';
import { useMemo } from 'react';
import { getSpenderKey, type SpenderLookup, useSpenderData } from './useSpenderData';

export const useAllowanceSpenderData = (
  allowances: TokenAllowanceData[],
): Record<string, Nullable<SpenderData | SpenderRiskData>> => {
  const uniqueSpenders = useMemo<SpenderLookup[]>(() => {
    const allSpenders = allowances
      .filter((allowance) => !isNullish(allowance.payload?.spender))
      .map((allowance) => ({ chainId: allowance.chainId, spender: allowance.payload!.spender }));
    return deduplicateArray(allSpenders, (spender) => getSpenderKey(spender.chainId, spender.spender));
  }, [allowances]);

  return useSpenderData(uniqueSpenders);
};
