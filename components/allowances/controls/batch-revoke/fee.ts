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
};

export const getFeeDollarAmount = (chainId: number, allowancesCount: number) => {
  // We don't charge a fee if it is sponsored
  if (FEE_SPONSORS[chainId]) return 0;

  // We don't charge a fee for a batch smaller than 2 allowances, since then it is essentially one-by-one revoking
  if (allowancesCount < 2) return 0;

  return BASE_FEE + allowancesCount * PER_ALLOWANCE_FEE;
};

export const isNonZeroFeeDollarAmount = (feeDollarAmount: string) => {
  return Number(feeDollarAmount) > 0;
};
