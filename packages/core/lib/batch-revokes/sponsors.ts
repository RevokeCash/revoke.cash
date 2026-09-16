import { ChainId } from '@revoke.cash/core/chains/ids';
import { PREMIUM_BATCH_REVOKE_SPONSOR } from '@revoke.cash/core/constants';

export interface FeeSponsor {
  name: string;
  url?: string;
}

// Chains where a partner covers the batch revoke fee, so users are not charged
export const FEE_SPONSORS: Record<number, FeeSponsor> = {
  [ChainId.Optimism]: {
    name: 'Optimism Foundation',
    url: 'https://www.optimism.io/',
  },
  [ChainId.Monad]: {
    name: 'Monad Foundation',
    url: 'https://www.monad.foundation/',
  },
};

// The name recorded on a batch revoke whose fee was waived; a Revoke Premium subscription takes
// precedence over a chain sponsor
export const getBatchRevokeSponsor = (chainId: number, isPremium: boolean): string | null => {
  if (isPremium) return PREMIUM_BATCH_REVOKE_SPONSOR;
  return FEE_SPONSORS[chainId]?.name ?? null;
};
