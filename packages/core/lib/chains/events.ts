import { ChainId } from '@revoke.cash/chains';
import { AGW_SESSIONS_ABI } from '@revoke.cash/core/abis';
import blocksCache from '@revoke.cash/core/cache/blocks';
import eventsCache from '@revoke.cash/core/cache/events';
import { createViemPublicClientForChain, type DocumentedChainId, getChainName } from '@revoke.cash/core/chains';
import { type EnrichedTokenEvent, isApprovalTokenEvent, parseLog, type TokenEvent } from '@revoke.cash/core/events';
import { EventDataSourceOutOfSyncError } from '@revoke.cash/core/events/errors';
import { buildTokenEventFilters } from '@revoke.cash/core/events/filters';
import { processErc721ApprovalEvents, removeLoneRevokeEvents } from '@revoke.cash/core/events/processing';
import type { LogsProvider } from '@revoke.cash/core/events/providers';
import { addressToTopic, sortTokenEventsChronologically } from '@revoke.cash/core/events/utils';
import { parseSessionCreatedLog, type SessionCreatedEvent } from '@revoke.cash/core/sessions';
import { getEventTokenReference, getTokenMetadata, throwIfSpamBytecode } from '@revoke.cash/core/tokens';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { isSpamError, isTransientError, stringifyError } from '@revoke.cash/core/utils/errors';
import { mapAsync, withTimeout } from '@revoke.cash/core/utils/promises';
import { type Address, getAbiItem, type PublicClient, toEventSelector } from 'viem';
import { addThousandsSeparators } from '../utils/formatting';
import { SECOND } from '../utils/time';

// Note: ideally I would have included this in the 'Chain' class, but this causes circular dependency issues and issues with Edge runtime
// So we use this separate file instead to configure token event getting per chain.

export interface TokenEventsResult {
  state: {
    checkedAt: string | null;
    computedToBlock: number | null;
  };
  events: EnrichedTokenEvent[];
  rawEvents: TokenEvent[];
}

export interface TokenEventsOptions {
  includeTransferFromEvents?: boolean;
  maxLogs?: number;
}

export const getTokenEvents = async (
  chainId: DocumentedChainId,
  address: Address,
  logsProvider: LogsProvider,
  options: TokenEventsOptions = {},
): Promise<TokenEventsResult> => {
  const chainName = getChainName(chainId);
  const publicClient = createViemPublicClientForChain(chainId);
  const checkedAt = new Date().toISOString();

  if (!(await hasChainActivity(chainId, address, publicClient))) {
    console.log(`${chainName}: Skipping event fetching for address with no relevant activity (${address})`);
    return { state: { checkedAt, computedToBlock: null }, events: [], rawEvents: [] };
  }

  const { events: rawEvents, computedToBlock } = await getTokenEventsDefault(chainId, address, logsProvider, options);
  const events = await enrichTokenEvents(rawEvents, publicClient, chainId);

  return { state: { checkedAt, computedToBlock }, events, rawEvents };
};

export const hasChainActivity = async (
  chainId: DocumentedChainId,
  address: Address,
  publicClient?: PublicClient,
): Promise<boolean> => {
  if (chainId === ChainId.PulseChain) return hasPulseChainPostForkActivity(address);

  // If the address is an EOA and has no transactions, we can skip fetching events for efficiency. Note that all deployed contracts have a nonce of >= 1
  // See https://eips.ethereum.org/EIPS/eip-161
  const client = publicClient ?? createViemPublicClientForChain(chainId);
  const nonce = await withTimeout(client.getTransactionCount({ address }), 10 * SECOND, 'RPC is unresponsive');
  return nonce > 0;
};

// For pulsechain we want to check whether an account has transacted after the fork timestamp,
// since otherwise everyone that used Ethereum before the fork would have to wait to get their events.
// Note: this doesn't work 100% for smart contract addresses, but the trade-off is worth it.
const hasPulseChainPostForkActivity = async (address: Address): Promise<boolean> => {
  const PULSECHAIN_FORK_BLOCK = 17_233_000;
  const publicClient = createViemPublicClientForChain(ChainId.PulseChain);

  try {
    const [nonce, forkNonce, addressCode] = await Promise.all([
      publicClient.getTransactionCount({ address }),
      publicClient.getTransactionCount({ address, blockNumber: BigInt(PULSECHAIN_FORK_BLOCK) }),
      publicClient.getCode({ address }),
    ]);

    // If the address is a smart contract, we cannot determine if it has activity after the fork, so we assume it does.
    if (!isNullish(addressCode) && addressCode !== '0x') return true;

    return nonce > forkNonce;
  } catch {
    // If we somehow cannot determine if the address has activity, we assume it does to avoid blocking users.
    return true;
  }
};

const getEventPrerequisites = async (chainId: DocumentedChainId, logsProvider: LogsProvider) => {
  const publicClient = createViemPublicClientForChain(chainId);

  const [fromBlock, toBlock, rpcBlock] = await Promise.all([
    0,
    logsProvider.getLatestBlock(),
    publicClient.getBlockNumber(),
  ]);

  if (rpcBlock > toBlock + 1000) {
    console.log(
      `${getChainName(chainId)}: Events data source is out of sync with the blockchain, please try again later.`,
    );
    throw new EventDataSourceOutOfSyncError(chainId);
  }

  return { logsProvider, fromBlock, toBlock };
};

const getTokenEventsDefault = async (
  chainId: DocumentedChainId,
  address: Address,
  logsProvider: LogsProvider,
  options: TokenEventsOptions,
): Promise<{ events: TokenEvent[]; computedToBlock: number }> => {
  const { fromBlock, toBlock } = await getEventPrerequisites(chainId, logsProvider);

  const filters = Object.entries(buildTokenEventFilters(address, fromBlock, toBlock, options));

  const logsResults = await mapAsync(filters, async ([name, filter]) =>
    eventsCache.getLogs(logsProvider, filter, chainId, name),
  );

  const logs = logsResults.flat();

  if (options.maxLogs && logs.length > options.maxLogs) {
    throw new Error(`Address has too much activity: ${addThousandsSeparators(logs.length.toString())} event logs`);
  }

  const events = logs.map((log) => parseLog(log, chainId, address)).filter((event) => !isNullish(event));

  // We sort the events in reverse chronological order to ensure that the most recent events are processed first
  return { events: sortTokenEventsChronologically(events).reverse(), computedToBlock: toBlock };
};

const enrichTokenEvents = async (
  events: TokenEvent[],
  publicClient: PublicClient,
  chainId: number,
): Promise<EnrichedTokenEvent[]> => {
  if (events.length === 0) return [];

  const approvalEvents = events.filter(isApprovalTokenEvent);

  // Filter spurious ERC721 transfer-triggered "revokes" and annotate meaningful revokes with oldSpender
  const processedApprovals = processErc721ApprovalEvents(approvalEvents);

  // Remove token/spender groups that only have revokes with no corresponding approval (spam)
  const cleanedApprovals = removeLoneRevokeEvents(processedApprovals);

  // Get unique tokens from cleaned approval events
  const uniqueTokenEvents = deduplicateArray(cleanedApprovals, (event) => event.token);

  // Get metadata for all unique tokens and filter out spam
  const metadataMap = new Map();
  await Promise.all(
    uniqueTokenEvents.map(async (event) => {
      try {
        const token = getEventTokenReference(event)!;
        const [metadata] = await Promise.all([
          getTokenMetadata(token, publicClient, chainId),
          throwIfSpamBytecode(event.token, publicClient),
        ]);
        metadataMap.set(event.token, metadata);
      } catch (e) {
        if (isSpamError(e)) return;

        console.warn(`Failed to fetch metadata for token ${event.token} on chain ${chainId}:`, e);
        if (isTransientError(e)) throw e;
        if (stringifyError(e)?.includes('Cannot decode zero data')) throw e;
      }
    }),
  );

  // Combine processed approvals with transfer events, keeping only those whose token has metadata
  const transferEvents = events.filter((event) => !isApprovalTokenEvent(event));
  const enrichableEvents = [...cleanedApprovals, ...transferEvents].filter((event) => metadataMap.has(event.token));

  // Resolve timestamps and attach metadata
  const enrichedEvents = await Promise.all(
    enrichableEvents.map(async (event) => {
      const time = await blocksCache.getTimeLog(publicClient, event.time);
      return { ...event, time, metadata: metadataMap.get(event.token)! };
    }),
  );

  return sortTokenEventsChronologically(enrichedEvents).reverse();
};

export const getSessionEvents = async (
  chainId: DocumentedChainId,
  address: Address,
  logsProvider: LogsProvider,
): Promise<SessionCreatedEvent[]> => {
  if (chainId !== ChainId.Abstract) {
    throw new Error('Sessions are only supported on Abstract');
  }

  // If the address is an EOA and has no transactions, we can skip fetching events for efficiency. Note that all deployed contracts have a nonce of >= 1
  // See https://eips.ethereum.org/EIPS/eip-161
  const chainName = getChainName(chainId);
  const publicClient = createViemPublicClientForChain(chainId);
  const nonce = await publicClient.getTransactionCount({ address });
  if (nonce === 0) {
    console.log(`${chainName}: Skipping event fetching for EOA with no transactions (${address})`);
    return [];
  }

  const { fromBlock, toBlock } = await getEventPrerequisites(chainId, logsProvider);

  const eventSelector = toEventSelector(getAbiItem({ abi: AGW_SESSIONS_ABI, name: 'SessionCreated' }));
  const addressTopic = addressToTopic(address);

  const sessionEvents = await eventsCache.getLogs(
    logsProvider,
    { topics: [eventSelector, addressTopic], fromBlock, toBlock },
    chainId,
    'SessionCreated',
  );

  const parsedEvents = sessionEvents.map((log) => parseSessionCreatedLog(log, chainId));

  return parsedEvents;
};
