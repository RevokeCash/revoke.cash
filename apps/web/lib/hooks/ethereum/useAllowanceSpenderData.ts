import type { Nullable, SpenderData, SpenderRiskData } from 'lib/interfaces';
import { deduplicateArray, isNullish } from 'lib/utils';
import type { TokenAllowanceData } from 'lib/utils/allowances';
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
