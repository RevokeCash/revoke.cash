import { toLowercaseAddress } from '@revoke.cash/core/utils';
import type { Address } from 'viem';

export interface AutoRevokeEvaluateJobData {
  address: Address;
  chainId: number;
  reason: 'allowance_state_behind';
}

export const AUTO_REVOKE_EVALUATE_QUEUE_NAME = 'auto_revoke_evaluate';

export const autoRevokeEvaluateJobId = (chainId: number, address: Address): string =>
  `evaluate-address-${chainId}-${toLowercaseAddress(address)}`;
