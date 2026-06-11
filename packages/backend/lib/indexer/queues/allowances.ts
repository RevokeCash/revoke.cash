import { toLowercaseAddress } from '@revoke.cash/core/utils';
import type { Address } from 'viem';

export interface AllowancesJobData {
  address: Address;
  chainId: number;
  eventsScanId?: string;
}

export const ALLOWANCES_QUEUE_NAME = 'indexer_allowances';

export const allowanceRecomputeJobId = (chainId: number, address: Address): string =>
  `recompute-allowances-${chainId}-${toLowercaseAddress(address)}`;
