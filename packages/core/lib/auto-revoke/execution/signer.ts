import type { Delegation } from '@metamask/smart-accounts-kit';
import { type Address, type Hash, type Hex, isAddressEqual } from 'viem';

// All signed cold delegations, keyed by the hot wallet (delegate) they empower. Delegations follow
// the wallet: rotating a hot wallet adds a new entry while the retired wallet's delegations stay
// listed, so the killswitch can still disable them on-chain.
export type ColdDelegationRegistry = Record<Address, ColdDelegations>;
export type ColdDelegations = Record<number, Delegation>;

export const getColdDelegationsForWallet = (registry: ColdDelegationRegistry, address: Address): ColdDelegations => {
  const matchingKey = Object.keys(registry).find((key) => isAddressEqual(key as Address, address));
  return matchingKey ? registry[matchingKey as Address] : {};
};

export type ExecutionLane = 'normal' | 'urgent';

export interface SignedTransaction {
  chainId: number;
  txHash: Hash;
  rawTransaction: Hex;
}

export interface UnsignedTransaction {
  chainId: number;
  to: Address;
  data: Hex;
  gas: bigint;
  value?: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  nonce: number;
}

export interface Signer {
  readonly address: Address;
  getColdDelegation(chainId: number): Delegation;
  signTransaction(transaction: UnsignedTransaction): Promise<SignedTransaction>;
  submitSignedTransaction(transaction: SignedTransaction): Promise<Hash>;
}

// One hot wallet per execution lane: urgent (exploit) revokes run on their own wallet and thus
// their own per-chain nonce pipeline, so they are never stuck behind queued normal revokes.
export interface ExecutorSigners {
  readonly normal: Signer;
  readonly urgent: Signer;
}

export const findSignerByAddress = (signers: ExecutorSigners, address: Address): Signer | null => {
  if (isAddressEqual(signers.normal.address, address)) return signers.normal;
  if (isAddressEqual(signers.urgent.address, address)) return signers.urgent;
  return null;
};
