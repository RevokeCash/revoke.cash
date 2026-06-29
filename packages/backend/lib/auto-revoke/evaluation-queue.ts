import { toLowercaseAddress } from '@revoke.cash/core/utils';
import type { Address } from 'viem';

export interface AutoRevokeEvaluateJobData {
  address: Address;
  chainId: number;
  reason: 'allowance_recompute';
  eventsScanId?: string;
}

export interface AutoRevokeExploitJobData {
  slug: string;
}

export const AUTO_REVOKE_EVALUATE_QUEUE_NAME = 'auto_revoke_evaluate';
export const AUTO_REVOKE_EXPLOIT_QUEUE_NAME = 'auto_revoke_exploit';

export const autoRevokeEvaluateJobId = (chainId: number, address: Address): string =>
  `evaluate-address-${chainId}-${toLowercaseAddress(address)}`;
export const autoRevokeExploitJobId = (slug: string): string => `exploit-${slug}`;
