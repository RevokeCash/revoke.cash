import { ChainId } from '@revoke.cash/chains';

export const BASE_FEE = 0.75;
export const PER_ALLOWANCE_FEE = 0.05;

export const FEE_SPONSORS: Record<number, string> = {
  [ChainId.OPMainnet]: 'Optimism Foundation',
};

export const getFeeDollarAmount = (chainId: number, allowancesCount: number) => {
  if (FEE_SPONSORS[chainId]) return 0;
  return BASE_FEE + allowancesCount * PER_ALLOWANCE_FEE;
};
