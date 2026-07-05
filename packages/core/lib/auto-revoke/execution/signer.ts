import type { Delegation } from '@metamask/smart-accounts-kit';
import type { Address, Hash, Hex } from 'viem';

export type ColdDelegations = Record<number, Delegation>;

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
