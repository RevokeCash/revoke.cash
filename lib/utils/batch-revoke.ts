import { getTipSelection } from 'lib/hooks/ethereum/useDonate';
import type { TokenAllowanceData } from './allowances';
import { analytics } from './analytics';

export type BatchType = 'eip5792' | 'queued';

export const trackBatchRevoke = (
  chainId: number,
  address: string,
  allowances: TokenAllowanceData[],
  tipAmount: string,
  batchType: BatchType,
) => {
  analytics.track('Batch Revoked', {
    chainId,
    address,
    allowances: allowances.length,
    tipSelection: getTipSelection(chainId, tipAmount),
    amount: tipAmount,
    batchType,
  });
};
