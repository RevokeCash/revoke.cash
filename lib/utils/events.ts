import { ERC20_ABI, ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import { Log, TimeLog } from 'lib/interfaces';
import { Address, decodeEventLog } from 'viem';

export enum TokenEventType {
  APPROVAL_ERC20 = 'APPROVAL_ERC20',
  APPROVAL_ERC721 = 'APPROVAL_ERC721',
  APPROVAL_FOR_ALL = 'APPROVAL_FOR_ALL',
  PERMIT2 = 'PERMIT2',
}

export interface BaseTokenEvent {
  type: TokenEventType;
  chainId: number;
  token: Address;
  owner: Address;
  time: TimeLog;
  payload: any;
  rawLog: Log;
}

export interface Erc20ApprovalEvent extends BaseTokenEvent {
  type: TokenEventType.APPROVAL_ERC20;
  payload: {
    spender: Address;
    amount: bigint;
  };
}

export interface Erc721ApprovalEvent extends BaseTokenEvent {
  type: TokenEventType.APPROVAL_ERC721;
  payload: {
    spender: Address;
    tokenId: bigint;
  };
}

export interface Erc721ApprovalForAllEvent extends BaseTokenEvent {
  type: TokenEventType.APPROVAL_FOR_ALL;
  payload: {
    spender: Address;
    approved: boolean;
  };
}

export interface Permit2Event extends BaseTokenEvent {
  type: TokenEventType.PERMIT2;
  payload: {
    spender: Address;
    permit2Address: Address;
    amount: bigint;
    expiration: number;
  };
}

export type ApprovalTokenEvent = Erc20ApprovalEvent | Erc721ApprovalEvent | Erc721ApprovalForAllEvent | Permit2Event;
export type TokenEvent = ApprovalTokenEvent;

export const parsePermit2Log = (log: Log, chainId: number): Permit2Event => {
  const parsedEvent = decodeEventLog({ abi: PERMIT2_ABI, data: log.data, topics: log.topics, strict: false }) as any;

  const { owner, token, spender, amount: maybeAmount, expiration } = parsedEvent.args;
  const amount = parsedEvent.eventName === 'Lockdown' ? 0n : maybeAmount;
  const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

  const payload = { spender, permit2Address: log.address, amount, expiration };

  return { type: TokenEventType.PERMIT2, rawLog: log, token, chainId, owner, time, payload };
};

export const parseApprovalLog = (log: Log, chainId: number): Erc20ApprovalEvent | Erc721ApprovalEvent => {
  const type = log.topics.length === 4 ? TokenEventType.APPROVAL_ERC721 : TokenEventType.APPROVAL_ERC20;
  const abi = type === TokenEventType.APPROVAL_ERC721 ? ERC721_ABI : ERC20_ABI;

  const parsedEvent = decodeEventLog({ abi, data: log.data, topics: log.topics, strict: false }) as any;

  const { owner, spender, tokenId, amount } = parsedEvent.args;
  const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

  const payload = { spender, tokenId, amount };

  return { type, rawLog: log, token: log.address, chainId, owner, time, payload };
};

export const parseApprovalForAllLog = (log: Log, chainId: number): Erc721ApprovalForAllEvent => {
  const parsedEvent = decodeEventLog({ abi: ERC721_ABI, data: log.data, topics: log.topics, strict: false }) as any;

  const { owner, spender, approved } = parsedEvent.args;
  const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

  const payload = { spender, approved };

  return { type: TokenEventType.APPROVAL_FOR_ALL, rawLog: log, token: log.address, chainId, owner, time, payload };
};
