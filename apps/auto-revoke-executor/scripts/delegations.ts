import type { ExecutionLane } from '@revoke.cash/core/auto-revoke/execution/signer';
import { getChainName } from '@revoke.cash/core/chains';

// Single registry file shared by all hot wallets, keyed by delegate address (ColdDelegationRegistry)
export const DEFAULT_DELEGATIONS_PATH = 'src/config/cold-delegations.json';

export const PRIVATE_KEY_ENV_BY_LANE: Record<ExecutionLane, string> = {
  normal: 'AUTO_REVOKE_EXECUTOR_PRIVATE_KEY',
  urgent: 'AUTO_REVOKE_URGENT_EXECUTOR_PRIVATE_KEY',
};

export const DEFAULT_DERIVATION_PATH = "44'/60'/0'/0/0";

export const describeChain = (chainId: number): string => {
  try {
    return `${getChainName(chainId)} (${chainId})`;
  } catch {
    return `chain ${chainId}`;
  }
};

export const parseExecutionLane = (value: string): ExecutionLane => {
  if (value !== 'normal' && value !== 'urgent') {
    throw new Error(`Invalid --lane value "${value}" (expected "normal" or "urgent")`);
  }
  return value;
};

export const parseFlags = (args: string[]): Map<string, string> => {
  return new Map(
    args.map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value ?? 'true'] as const;
    }),
  );
};
