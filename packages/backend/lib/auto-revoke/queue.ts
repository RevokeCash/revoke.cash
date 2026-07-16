import type { ExecutionLane } from '@revoke.cash/core/auto-revoke/execution/signer';

export interface AutoRevokeExecuteJobData {
  actionId: string;
  chainId: number;
  lane: ExecutionLane;
}

export const AUTO_REVOKE_EXECUTE_QUEUE_NAME = 'auto_revoke_execute';

export const autoRevokeExecuteJobId = (actionId: string): string => `execute-action-${actionId}`;
