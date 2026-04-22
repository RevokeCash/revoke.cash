import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isTestnetChain } from '@revoke.cash/core/chains';
import { isNullish } from '@revoke.cash/core/utils';
import ky from 'lib/ky';
import analytics from 'lib/utils/analytics';
import type { Address } from 'viem';

export type BatchType = 'eip5792' | 'queued';

export const trackBatchRevoke = (
  chainId: number,
  address: string,
  allowances: Array<TokenAllowanceData | undefined>,
  feeDollarAmount: string,
  batchType: BatchType,
  sponsor: string | null,
) => {
  analytics.track('Batch Revoked', {
    chainId,
    address,
    allowances: allowances.filter((a) => !isNullish(a)).length,
    feeDollarAmount: Number(feeDollarAmount),
    batchType,
    isTestnet: isTestnetChain(chainId),
    sponsor,
  });
};

export const recordBatchRevoke = async (
  chainId: number,
  transactionHash: string | null,
  userAddress: Address,
  feePaid: string,
  sponsor: string | null,
) => {
  await ky.post(`/api/${chainId}/batch-revoke`, {
    json: {
      transactionHash,
      userAddress,
      feePaid: Number(feePaid),
      sponsor,
    },
  });
};
