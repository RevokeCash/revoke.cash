import { AGW_SESSIONS_ABI } from 'lib/abis';
import blocksDB from 'lib/databases/blocks';
import type { useSessions } from 'lib/hooks/ethereum/sessions/useSessions';
import { type Address, type Hash, type Hex, type PublicClient, type WalletClient, decodeEventLog } from 'viem';
import { getWalletAddress, isNullish, writeContractUnlessExcessiveGas } from '.';
import type { Log, TimeLog } from './events';

export interface SessionCreatedEvent {
  type: 'SESSION_CREATED';
  chainId: number;
  account: Address;
  time: TimeLog;
  payload: {
    sessionHash: Hash;
    sessionSpec: SessionSpec;
  };
  rawLog: Log;
}

interface SessionSpec {
  signer: Address;
  expiresAt: bigint;
  feeLimit: UsageLimit;
  callPolicies: readonly CallSpec[];
  transferPolicies: readonly TransferSpec[];
}

interface UsageLimit {
  limitType: number;
  limit: bigint;
  period: bigint;
}

interface CallSpec {
  target: Address;
  selector: Hex;
  maxValuePerUse: bigint;
  valueLimit: UsageLimit;
  constraints: readonly Constraint[];
}

interface TransferSpec {
  target: Address;
  maxValuePerUse: bigint;
  valueLimit: UsageLimit;
}

interface Constraint {
  condition: number;
  index: bigint;
  refValue: Hex;
  limit: UsageLimit;
}

export const parseSessionCreatedLog = (log: Log, chainId: number): SessionCreatedEvent => {
  const parsedEvent = decodeEventLog({
    abi: AGW_SESSIONS_ABI,
    eventName: 'SessionCreated',
    data: log.data,
    topics: log.topics,
    strict: true,
  });

  const { account, sessionHash, sessionSpec } = parsedEvent.args;
  const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

  return { type: 'SESSION_CREATED', rawLog: log, chainId, account, time, payload: { sessionHash, sessionSpec } };
};

export interface Session {
  chainId: number;
  account: Address;
  validatorAddress: Address;
  payload: {
    sessionHash: Hash;
    sessionSpec: SessionSpec;
  };
  lastUpdated: TimeLog;
}

enum SessionStatus {
  NotInitialized = 0,
  Active = 1,
  Closed = 2,
  Expired = 3,
}

export const getSessionsFromEvents = async (
  events: SessionCreatedEvent[],
  publicClient: PublicClient,
): Promise<Session[]> => {
  const sessions = await Promise.all(events.map((event) => getSessionFromEvent(event, publicClient)));
  return sessions.filter((session) => !isNullish(session));
};

const getSessionFromEvent = async (
  event: SessionCreatedEvent,
  publicClient: PublicClient,
): Promise<Session | undefined> => {
  if (event.payload.sessionSpec.expiresAt < BigInt(Date.now()) / 1000n) return undefined;

  const status = await publicClient.readContract({
    address: event.rawLog.address,
    abi: AGW_SESSIONS_ABI,
    functionName: 'sessionStatus',
    args: [event.account, event.payload.sessionHash],
  });

  if (status !== SessionStatus.Active) return undefined;

  return {
    chainId: event.chainId,
    account: event.account,
    validatorAddress: event.rawLog.address,
    payload: event.payload,
    lastUpdated: await blocksDB.getTimeLog(publicClient, event.time),
  };
};

export const revokeSession = async (session: Session, walletClient: WalletClient, publicClient: PublicClient) => {
  const transactionRequest = await prepareRevokeSession(session, walletClient, publicClient);
  const hash = await writeContractUnlessExcessiveGas(publicClient, walletClient, transactionRequest);
  return hash;
};

export const prepareRevokeSession = async (
  session: Session,
  walletClient: WalletClient,
  publicClient: PublicClient,
) => {
  const transactionRequest = {
    address: session.validatorAddress,
    abi: AGW_SESSIONS_ABI,
    functionName: 'revokeKey' as const,
    args: [session.payload.sessionHash] as const,
    account: await getWalletAddress(walletClient),
    chain: walletClient.chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  const gas = await publicClient.estimateContractGas(transactionRequest);

  return { ...transactionRequest, gas };
};

export const getSessionKey = (session: Session) => {
  return `session-${session.chainId}-${session.account}-${session.payload.sessionHash}`;
};

export type OnSessionRevoke = ReturnType<typeof useSessions>['onSessionRevoke'];
