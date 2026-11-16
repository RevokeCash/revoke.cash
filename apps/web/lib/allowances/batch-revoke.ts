import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isTestnetChain } from '@revoke.cash/core/chains';
import { isNullish } from '@revoke.cash/core/utils';
import ky from 'lib/ky';
import analytics from 'lib/utils/analytics';
import { addCrispEvent, formatCrispChain } from 'lib/utils/crisp';
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

  addCrispEvent('Batch revoke', {
    chain: formatCrispChain(chainId),
    allowances: allowances.filter((allowance) => !isNullish(allowance)).length,
    method: batchType,
    fee: feeDollarAmount,
    sponsor,
  });
};

export const recordBatchRevoke = async (
  chainId: number,
  transactionHash: string | null,
  userAddress: Address,
  feeDollarAmount: string,
) => {
  // keepalive lets the request finish when the user closes the page right after the wallet confirms
  await ky.post(`/api/${chainId}/batch-revoke`, {
    json: {
      transactionHash,
      userAddress,
      feeUsdCents: Math.round(Number(feeDollarAmount) * 100),
    },
    keepalive: true,
  });
};
