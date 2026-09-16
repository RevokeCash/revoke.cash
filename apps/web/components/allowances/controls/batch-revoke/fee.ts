import { FEE_SPONSORS } from '@revoke.cash/core/batch-revokes/sponsors';
import { BATCH_REVOKE_FEE_USD_CENTS } from '@revoke.cash/core/constants';

export const BATCH_REVOKE_FEE = BATCH_REVOKE_FEE_USD_CENTS / 100;

export const getFeeDollarAmount = (chainId: number, allowancesCount: number, isPremium?: boolean) => {
  // Premium users get unlimited batch revokes for free
  if (isPremium) return 0;

  // We don't charge a fee if it is sponsored
  if (FEE_SPONSORS[chainId]) return 0;

  // We don't charge a fee for a batch smaller than 2 allowances, since then it is essentially one-by-one revoking
  if (allowancesCount < 2) return 0;

  return BATCH_REVOKE_FEE;
};

export const isZeroFeeDollarAmount = (feeDollarAmount: string) => {
  return Number(feeDollarAmount) === 0;
};
