import ky from 'lib/ky';
import { isNullish } from '.';
import type { TokenAllowanceData } from './allowances';
import analytics from './analytics';
import { isTestnetChain } from './chains';

export type BatchType = 'eip5792' | 'queued';

export const trackBatchRevoke = (
  chainId: number,
  address: string,
  allowances: Array<TokenAllowanceData | undefined>,
  feeDollarAmount: string,
  batchType: BatchType,
) => {
  analytics.track('Batch Revoked', {
    chainId,
    address,
    allowances: allowances.filter((a) => !isNullish(a)).length,
    feeDollarAmount: Number(feeDollarAmount),
    batchType,
    isTestnet: isTestnetChain(chainId),
  });
};

export const recordBatchRevoke = async (chainId: number, transactionHash: string, feePaid: string) => {
  await ky.post(`/api/${chainId}/batch-revoke`, {
    json: {
      chainId,
      transactionHash,
      feePaid,
    },
  });
};
