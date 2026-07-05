export interface AutoRevokeExecuteJobData {
  actionId: string;
  chainId: number;
}

export const AUTO_REVOKE_EXECUTE_QUEUE_NAME = 'auto_revoke_execute';

export const autoRevokeExecuteJobId = (actionId: string): string => `execute-action-${actionId}`;
