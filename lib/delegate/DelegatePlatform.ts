import type { Address, PublicClient } from 'viem';

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

export interface DelegatePlatform {
  publicClient: PublicClient;
  getDelegations: (wallet: Address) => Promise<Delegation[]>;
  revokeDelagation: (delegation: Delegation) => Promise<void>;
  revokeAllDelegations: (delegations: Delegation[]) => Promise<void>;
}
