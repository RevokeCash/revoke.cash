import type { Abi, Address, PublicClient } from 'viem';

export type DelegationDirection = 'OUTGOING' | 'INCOMING';
export type DelegationType = 'ALL' | 'CONTRACT' | 'TOKEN' | 'ERC721' | 'ERC1155' | 'ERC20';
export interface Delegation {
  type: 'NONE' | DelegationType;
  delegator: Address;
  delegate: Address;
  contract: Address | null;
  tokenId: number | bigint | null;
  direction: DelegationDirection;
  platform: string;
  chainId: number;
  expirationTimestamp?: bigint;
}

export interface DelegationV2 extends Delegation {
  rights: string;
}
export interface TransactionData {
  address: Address;
  abi: Abi;
  functionName: string;
  args: any[];
  account?: Address;
}

export interface DelegatePlatform {
  name: string;
  chainId: Promise<number>;
  publicClient: PublicClient;
  getDelegations: (wallet: Address) => Promise<Delegation[]>;
  revokeDelegation: (delegation: Delegation) => Promise<TransactionData>;
}
