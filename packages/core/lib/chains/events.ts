import { ChainId } from '@revoke.cash/chains';
import { AGW_SESSIONS_ABI } from '@revoke.cash/core/abis';
import blocksCache from '@revoke.cash/core/cache/blocks';
import eventsCache from '@revoke.cash/core/cache/events';
import {
  createViemPublicClientForChain,
  type DocumentedChainId,
  getChainApiUrl,
  getChainName,
} from '@revoke.cash/core/chains';
import { ADDRESS_ZERO, DUMMY_ADDRESS } from '@revoke.cash/core/constants';
import {
  type ApprovalTokenEvent,
  type EnrichedTokenEvent,
  isApprovalTokenEvent,
  isRevokeEvent,
  parseLog,
  type TokenEvent,
  TokenEventType,
} from '@revoke.cash/core/events';
import { buildTokenEventFilters } from '@revoke.cash/core/events/filters';
import type { LogsProvider } from '@revoke.cash/core/events/providers';
import { addressToTopic, logSorterChronological, sortTokenEventsChronologically } from '@revoke.cash/core/events/utils';
import ky from '@revoke.cash/core/ky';
import { parseSessionCreatedLog, type SessionCreatedEvent } from '@revoke.cash/core/sessions';
import { createTokenContract, getTokenMetadata, throwIfSpam } from '@revoke.cash/core/tokens';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { isSpamError, isTransientError, stringifyError } from '@revoke.cash/core/utils/errors';
import { mapAsync } from '@revoke.cash/core/utils/promises';
import { type Address, getAbiItem, type PublicClient, toEventSelector } from 'viem';

// Note: ideally I would have included this in the 'Chain' class, but this causes circular dependency issues and issues with Edge runtime
// So we use this separate file instead to configure token event getting per chain.

export interface TokenEventsResult {
  events: EnrichedTokenEvent[];
  rawEvents: TokenEvent[];
}

export const getTokenEvents = async (
  chainId: DocumentedChainId,
  address: Address,
  logsProvider: LogsProvider,
): Promise<TokenEventsResult> => {
  const chainName = getChainName(chainId);
  const publicClient = createViemPublicClientForChain(chainId);

  if (!(await hasChainActivity(chainId, address, publicClient))) {
    console.log(`${chainName}: Skipping event fetching for address with no relevant activity (${address})`);
    return { events: [], rawEvents: [] };
  }

  const rawEvents = await getTokenEventsDefault(chainId, address, logsProvider);
  const events = await enrichTokenEvents(rawEvents, publicClient, chainId);

  return { events, rawEvents };
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
  const nonce = await client.getTransactionCount({ address });
  return nonce > 0;
};

// For pulsechain we want to check whether an account has transacted after the fork timestamp,
// since otherwise everyone that used Ethereum before the fork would have to wait to get their events.
// Note: this doesn't work 100% for smart contract addresses, but the trade-off is worth it.
const hasPulseChainPostForkActivity = async (address: Address): Promise<boolean> => {
  const PULSECHAIN_FORK_BLOCK = 17_233_000;

  const apiUrl = getChainApiUrl(ChainId.PulseChain);
  const url = `${apiUrl}?module=account&action=txlist&address=${address}&start_block=${PULSECHAIN_FORK_BLOCK}`;
  const { result } = await ky.get(url).json<{ result: any[] | string }>();
  return Array.isArray(result) && result.length > 0;
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
    throw new Error(`Events data source is out of sync with the blockchain, please try again later.`);
  }

  return { logsProvider, fromBlock, toBlock };
};

const getTokenEventsDefault = async (
  chainId: DocumentedChainId,
  address: Address,
  logsProvider: LogsProvider,
): Promise<TokenEvent[]> => {
  const { fromBlock, toBlock } = await getEventPrerequisites(chainId, logsProvider);

  const filters = Object.entries(buildTokenEventFilters(address, fromBlock, toBlock));

  const logsResults = await mapAsync(filters, async ([name, filter]) =>
    eventsCache.getLogs(logsProvider, filter, chainId, name),
  );

  const events = logsResults
    .flat()
    .map((log) => parseLog(log, chainId, address))
    .filter((event) => !isNullish(event));

  // We sort the events in reverse chronological order to ensure that the most recent events are processed first
  return sortTokenEventsChronologically(events).reverse();
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
      const allTokenEvents = events.filter((other) => other.token === event.token);

      try {
        const contract = createTokenContract(event, publicClient)!;
        const [metadata] = await Promise.all([
          getTokenMetadata(contract, chainId),
          throwIfSpam(contract, allTokenEvents),
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

// ERC721_APPROVAL events are always emitted on token transfers with an ADDRESS_ZERO spender, so we need to look at
// the spender *before* that event to determine whether an existing approval was revoked in that event.
// If so, we set the oldSpender on the event so it can be displayed in the history table instead of the
// "new" spender (which is the zero address).
// If not, we remove the event, since it is superfluous.
const processErc721ApprovalEvents = (events: ApprovalTokenEvent[]): ApprovalTokenEvent[] => {
  const singleNftApprovalLastSpenderMap = new Map<string, Address>();

  return events
    .sort((a, b) => logSorterChronological(a.rawLog, b.rawLog))
    .map((event) => {
      if (event.type !== TokenEventType.APPROVAL_ERC721) return event;

      const spenderKey = `${event.chainId}-${event.token}-${event.payload.tokenId}`;
      const oldSpender = singleNftApprovalLastSpenderMap.get(spenderKey);
      singleNftApprovalLastSpenderMap.set(spenderKey, event.payload.spender);

      if (isNullish(oldSpender) || oldSpender === ADDRESS_ZERO) {
        if (event.payload.spender === ADDRESS_ZERO) return undefined;
      } else if (event.payload.spender === ADDRESS_ZERO) {
        return { ...event, payload: { ...event.payload, oldSpender } };
      }

      return event;
    })
    .filter((event) => !isNullish(event));
};

// If a token/spender pair has only revoke events, this is likely spam and should not be displayed
const removeLoneRevokeEvents = (events: ApprovalTokenEvent[]): ApprovalTokenEvent[] => {
  const groupedEvents = groupEventsByTokenAndSpender(events);

  const filterLoneRevokeEvents = (key: string, groupedTokenEvents: ApprovalTokenEvent[]) => {
    if (key.includes(DUMMY_ADDRESS) || key.includes(ADDRESS_ZERO)) return true;
    if (groupedTokenEvents.every((event) => isRevokeEvent(event))) return false;
    return true;
  };

  return Object.entries(groupedEvents)
    .filter(([key, groupedTokenEvents]) => filterLoneRevokeEvents(key, groupedTokenEvents))
    .flatMap(([_, groupedTokenEvents]) => groupedTokenEvents);
};

const groupEventsByTokenAndSpender = (events: ApprovalTokenEvent[]): Record<string, ApprovalTokenEvent[]> => {
  return events.reduce<Record<string, ApprovalTokenEvent[]>>((acc, event) => {
    const spender =
      event.type === TokenEventType.APPROVAL_ERC721 && event.payload.oldSpender
        ? event.payload.oldSpender
        : event.payload.spender;
    const key = `${event.chainId}-${event.token}-${spender}`;
    acc[key] = [...(acc[key] || []), event];
    return acc;
  }, {});
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
