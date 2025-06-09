import type { Address, WriteContractParameters } from 'viem';

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

export type TransactionData = Pick<WriteContractParameters, 'address' | 'abi' | 'functionName' | 'args'>;

export interface DelegatePlatform {
  name: string;
  chainId: number;
  getDelegations: (wallet: Address) => Promise<Delegation[]>;
  prepareRevokeDelegation: (delegation: Delegation) => Promise<TransactionData>;
}
