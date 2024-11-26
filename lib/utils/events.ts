import { ERC20_ABI, ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import type { ApprovalEvent, Log } from 'lib/interfaces';
import { decodeEventLog } from 'viem';

export const parsePermit2Log = (log: Log, chainId: number): ApprovalEvent => {
  const parsedEvent = decodeEventLog({
    abi: PERMIT2_ABI,
    data: log.data,
    topics: log.topics,
    strict: false,
  }) as any;

  const { owner, token, spender, amount: maybeAmount, expiration } = parsedEvent.args;
  const amount = parsedEvent.eventName === 'Lockdown' ? 0n : maybeAmount;
  const time = {
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp: log.timestamp,
  };

  return {
    rawLog: log,
    token,
    chainId,
    owner,
    spender,
    time,
    amount,
    expiration,
  };
};

export const parseApprovalLog = (log: Log, chainId: number): ApprovalEvent => {
  const abi = log.topics.length === 4 ? ERC721_ABI : ERC20_ABI;

  const parsedEvent = decodeEventLog({
    abi,
    data: log.data,
    topics: log.topics,
    strict: false,
  }) as any;

  const { owner, spender, tokenId, amount } = parsedEvent.args;
  const time = {
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp: log.timestamp,
  };

  return {
    rawLog: log,
    token: log.address,
    chainId,
    owner,
    spender,
    time,
    tokenId,
    amount,
  };
};

export const parseApprovalForAllLog = (log: Log, chainId: number): ApprovalEvent => {
  const parsedEvent = decodeEventLog({
    abi: ERC721_ABI,
    data: log.data,
    topics: log.topics,
    strict: false,
  }) as any;

  const { owner, spender, approved } = parsedEvent.args;
  const time = {
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp: log.timestamp,
  };

  return {
    rawLog: log,
    token: log.address,
    chainId,
    owner,
    spender,
    time,
    approved,
  };
};
