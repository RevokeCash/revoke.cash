import { ChainId } from '@revoke.cash/chains';

export const BASE_FEE = 1.5;
export const PER_ALLOWANCE_FEE = 0.0;

interface FeeSponsor {
  name: string;
  url?: string;
}

export const FEE_SPONSORS: Record<number, FeeSponsor> = {
  [ChainId.OPMainnet]: {
    name: 'Optimism Foundation',
    url: 'https://www.optimism.io/',
  },
  [ChainId.Palm]: {
    name: 'Revoke.cash',
  },
};

export const getFeeDollarAmount = (chainId: number, allowancesCount: number) => {
  if (FEE_SPONSORS[chainId]) return 0;
  return BASE_FEE + allowancesCount * PER_ALLOWANCE_FEE;
};

export const isNonZeroFeeDollarAmount = (feeDollarAmount: string) => {
  return Number(feeDollarAmount) > 0;
};
