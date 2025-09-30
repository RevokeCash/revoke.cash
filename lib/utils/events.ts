import { ERC20_ABI, ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import { ADDRESS_ZERO, MOONBIRDS_ADDRESS } from 'lib/constants';
import { type Address, type Hash, type Hex, decodeEventLog, toEventSelector } from 'viem';
import { addressToTopic, isNullish } from '.';
import { type AllowancePayload, AllowanceType } from './allowances';

export interface Log {
  address: Address;
  topics: [topic0: Hex, ...rest: Hex[]];
  data: Hex;
  transactionHash: Hash;
  blockNumber: number;
  transactionIndex: number;
  logIndex: number;
  timestamp?: number;
}

export type TimeLog = Pick<Log, 'transactionHash' | 'blockNumber' | 'timestamp'>;

export interface Filter {
  address?: Address;
  topics: Array<Hex | null>;
  fromBlock: number;
  toBlock: number;
}

export enum TokenEventType {
  APPROVAL_ERC20 = 'APPROVAL_ERC20',
  APPROVAL_ERC721 = 'APPROVAL_ERC721',
  APPROVAL_FOR_ALL = 'APPROVAL_FOR_ALL',
  PERMIT2 = 'PERMIT2',
  TRANSFER_ERC20 = 'TRANSFER_ERC20',
  TRANSFER_ERC721 = 'TRANSFER_ERC721',
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

export interface Erc20TransferEvent extends BaseTokenEvent {
  type: TokenEventType.TRANSFER_ERC20;
  payload: {
    from: Address;
    to: Address;
    amount: bigint;
  };
}

export interface Erc721TransferEvent extends BaseTokenEvent {
  type: TokenEventType.TRANSFER_ERC721;
  payload: {
    from: Address;
    to: Address;
    tokenId: bigint;
  };
}

export type ApprovalTokenEvent = Erc20ApprovalEvent | Erc721ApprovalEvent | Erc721ApprovalForAllEvent | Permit2Event;
export type TransferTokenEvent = Erc20TransferEvent | Erc721TransferEvent;
export type TokenEvent = ApprovalTokenEvent | TransferTokenEvent;

export const isTransferTokenEvent = (event: TokenEvent): event is TransferTokenEvent => {
  return event.type === TokenEventType.TRANSFER_ERC20 || event.type === TokenEventType.TRANSFER_ERC721;
};

export const isApprovalTokenEvent = (event: TokenEvent): event is ApprovalTokenEvent => {
  return (
    event.type === TokenEventType.APPROVAL_ERC20 ||
    event.type === TokenEventType.APPROVAL_ERC721 ||
    event.type === TokenEventType.APPROVAL_FOR_ALL ||
    event.type === TokenEventType.PERMIT2
  );
};

export const parsePermit2Log = (log: Log, chainId: number): Permit2Event | undefined => {
  try {
    const parsedEvent = decodeEventLog({ abi: PERMIT2_ABI, data: log.data, topics: log.topics, strict: false }) as any;

    const { owner, token, spender, amount: maybeAmount, expiration } = parsedEvent.args;
    const amount = parsedEvent.eventName === 'Lockdown' ? 0n : maybeAmount;
    const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

    if ([owner, token, spender, amount, expiration].some((arg) => isNullish(arg))) return undefined;

    // Different chains may have different instances of Permit2, so we use the address of the instance that emitted the approval event
    const payload = { spender, permit2Address: log.address, amount, expiration };
    return { type: TokenEventType.PERMIT2, rawLog: log, token, chainId, owner, time, payload };
  } catch {
    console.error('Malformed Permit2 log:', log);
    return undefined;
  }
};

export const parseApprovalLog = (log: Log, chainId: number): Erc20ApprovalEvent | Erc721ApprovalEvent | undefined => {
  try {
    // We are aware that there are certain old contracts that implement ERC721 incorrectly (like CryptoStrikers)
    // We previously had edge cases for this, but since limited approvals are very uncommon and are reset on transfer,
    // we no longer handle this edge case. ApprovalForAll should be unaffected.
    const type = log.topics.length === 4 ? TokenEventType.APPROVAL_ERC721 : TokenEventType.APPROVAL_ERC20;
    const abi = type === TokenEventType.APPROVAL_ERC721 ? ERC721_ABI : ERC20_ABI;

    const parsedEvent = decodeEventLog({ abi, data: log.data, topics: log.topics, strict: false }) as any;

    const { owner, spender, tokenId, amount } = parsedEvent.args;
    const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

    if ([owner, spender].some((arg) => isNullish(arg)) || [tokenId, amount].every((arg) => isNullish(arg))) {
      return undefined;
    }

    const payload = { spender, tokenId, amount };
    return { type, rawLog: log, token: log.address, chainId, owner, time, payload };
  } catch {
    console.error('Malformed approval log:', log);
    return undefined;
  }
};

export const parseApprovalForAllLog = (log: Log, chainId: number): Erc721ApprovalForAllEvent | undefined => {
  try {
    const parsedEvent = decodeEventLog({ abi: ERC721_ABI, data: log.data, topics: log.topics, strict: false }) as any;

    const { owner, spender, approved } = parsedEvent.args;
    const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

    if ([owner, spender, approved].some((arg) => isNullish(arg))) return undefined;

    const payload = { spender, approved };
    return { type: TokenEventType.APPROVAL_FOR_ALL, rawLog: log, token: log.address, chainId, owner, time, payload };
  } catch {
    console.error('Malformed approval for all log:', log);
    return undefined;
  }
};

export const parseTransferLog = (
  log: Log,
  chainId: number,
  owner: Address,
): Erc20TransferEvent | Erc721TransferEvent | undefined => {
  try {
    const type = log.topics.length === 4 ? TokenEventType.TRANSFER_ERC721 : TokenEventType.TRANSFER_ERC20;
    const abi = type === TokenEventType.TRANSFER_ERC721 ? ERC721_ABI : ERC20_ABI;

    const parsedEvent = decodeEventLog({ abi, data: log.data, topics: log.topics, strict: false }) as any;

    const { from, to, tokenId, amount } = parsedEvent.args;
    const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

    if ([owner, from, to].some((arg) => isNullish(arg)) || [tokenId, amount].every((arg) => isNullish(arg))) {
      return undefined;
    }

    const payload = { from, to, tokenId, amount };

    return { type, rawLog: log, token: log.address, chainId, owner, time, payload };
  } catch {
    console.error('Malformed transfer log:', log);
    return undefined;
  }
};

export const getEventKey = (event: TokenEvent) => {
  return JSON.stringify(event.rawLog);
};

// This function is a hardcoded patch to show Moonbirds' OpenSea allowances,
// which do not show up normally because of a bug in their contract
export const generatePatchedAllowanceEvents = (
  userAddress: Address,
  openseaProxyAddress?: Address,
  allEvents: Log[] = [],
): Log[] => {
  if (!userAddress || !openseaProxyAddress) return [];

  // Only add the Moonbirds approval event if the account has interacted with Moonbirds at all
  if (!allEvents.some((ev) => ev.address === MOONBIRDS_ADDRESS)) return [];

  return [
    {
      // We use the deployment transaction hash as a placeholder for the approval transaction hash
      transactionHash: '0xd4547dc336dd4a0655f11267537964d7641f115ef3d5440d71514e3efba9d210',
      blockNumber: 14591056,
      transactionIndex: 145,
      logIndex: 0,
      address: MOONBIRDS_ADDRESS,
      topics: [
        toEventSelector('ApprovalForAll(address,address,bool)'),
        addressToTopic(userAddress),
        addressToTopic(openseaProxyAddress),
      ],
      data: '0x1',
      timestamp: 1649997510,
    },
  ];
};

// This is a utility function to convert an approval event to an allowance payload uysed to display the allowance amount in the history table
// We can safely cast the result to AllowancePayload because the type is known to be valid
export const eventToAllowance = (event: ApprovalTokenEvent): AllowancePayload => {
  return {
    type:
      event.type === TokenEventType.APPROVAL_ERC20
        ? AllowanceType.ERC20
        : event.type === TokenEventType.APPROVAL_ERC721
          ? AllowanceType.ERC721_SINGLE
          : event.type === TokenEventType.APPROVAL_FOR_ALL
            ? AllowanceType.ERC721_ALL
            : AllowanceType.PERMIT2,
    ...event.payload,
    lastUpdated: event.time,
  } as unknown as AllowancePayload;
};

export const isRevokeEvent = (event: ApprovalTokenEvent): boolean => {
  if (event.type === TokenEventType.APPROVAL_ERC721) {
    return event.payload.spender === ADDRESS_ZERO;
  }

  if (event.type === TokenEventType.APPROVAL_FOR_ALL) {
    return !event.payload.approved;
  }

  return event.payload.amount === 0n;
};
