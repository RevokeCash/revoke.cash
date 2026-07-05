import type { Delegation } from '@metamask/smart-accounts-kit';

export type CeremonyOutput = Record<number, Delegation>;

export const DEFAULT_DELEGATIONS_PATH = 'src/config/cold-delegations.json';
export const DEFAULT_DERIVATION_PATH = "44'/60'/0'/0/0";

export const parseFlags = (args: string[]): Map<string, string> => {
  return new Map(
    args.map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value ?? 'true'] as const;
    }),
  );
};
