import { ChainId } from '@revoke.cash/chains';
import { AGW_SESSIONS_ABI, ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import { ADDRESS_ZERO, DUMMY_ADDRESS } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import eventsDB from 'lib/databases/events';
import ky from 'lib/ky';
import { getLogsProvider } from 'lib/providers';
import {
  addressToTopic,
  deduplicateArray,
  isNullish,
  logSorterChronological,
  sortTokenEventsChronologically,
} from 'lib/utils';
import { createViemPublicClientForChain, type DocumentedChainId, getChainApiUrl, getChainName } from 'lib/utils/chains';
import { isNetworkError, isRateLimitError, stringifyError } from 'lib/utils/errors';
import {
  type ApprovalTokenEvent,
  type EnrichedTokenEvent,
  generatePatchedAllowanceEvents,
  isApprovalTokenEvent,
  isRevokeEvent,
  parseApprovalForAllLog,
  parseApprovalLog,
  parsePermit2Log,
  parseTransferLog,
  type TokenEvent,
  TokenEventType,
} from 'lib/utils/events';
import { parseSessionCreatedLog, type SessionCreatedEvent } from 'lib/utils/sessions';
import { createTokenContract, getTokenMetadata, throwIfSpam } from 'lib/utils/tokens';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import { type Address, getAbiItem, type PublicClient, toEventSelector } from 'viem';

// Note: ideally I would have included this in the 'Chain' class, but this causes circular dependency issues and issues with Edge runtime
// So we use this separate file instead to configure token event getting per chain.

export interface TokenEventsResult {
  events: EnrichedTokenEvent[];
  rawEvents: TokenEvent[];
}

export const getTokenEvents = async (chainId: DocumentedChainId, address: Address): Promise<TokenEventsResult> => {
  // If the address is an EOA and has no transactions, we can skip fetching events for efficiency. Note that all deployed contracts have a nonce of >= 1
  // See https://eips.ethereum.org/EIPS/eip-161
  const chainName = getChainName(chainId);
  const publicClient = createViemPublicClientForChain(chainId);
  const nonce = await publicClient.getTransactionCount({ address });
  if (nonce === 0) {
    console.log(`${chainName}: Skipping event fetching for EOA with no transactions (${address})`);
    return { events: [], rawEvents: [] };
  }

  const override = ChainOverrides[chainId];
  const rawEvents = override ? await override(chainId, address) : await getTokenEventsDefault(chainId, address);
  const events = await enrichTokenEvents(rawEvents, publicClient, chainId);

  return { events, rawEvents };
};

type TokenEventsGetter = (chainId: DocumentedChainId, address: Address) => Promise<TokenEvent[]>;

const ChainOverrides: Record<number, TokenEventsGetter> = {
  // For pulsechain we want to check whether an account has transacted after the fork timestamp,
  // since otherwise everyone that used Ethereum before the fork would have to wait to get their events.
  // Note: this doesn't work 100% for smart contract addresses, but the trade-off is worth it.
  [ChainId.PulseChain]: async (chainId, address) => {
    const apiUrl = getChainApiUrl(chainId);
    const pulsechainForkBlock = 17233000;
    const url = `${apiUrl}?module=account&action=txlist&address=${address}&start_block=${pulsechainForkBlock}`;

    const { result } = await ky.get(url).json<{ result: any[] | string }>();
    if (!Array.isArray(result) || result.length === 0) return [];

    return getTokenEventsDefault(chainId, address);
  },
};

const getEventPrerequisites = async (chainId: DocumentedChainId, address: Address) => {
  const logsProvider = getLogsProvider(chainId);
  const publicClient = createViemPublicClientForChain(chainId);

  const [openSeaProxy, fromBlock, toBlock, rpcBlock] = await Promise.all([
    getOpenSeaProxyAddress(address),
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

  return { logsProvider, openSeaProxy, fromBlock, toBlock };
};

const getTokenEventsDefault = async (chainId: DocumentedChainId, address: Address): Promise<TokenEvent[]> => {
  const { openSeaProxy, logsProvider, fromBlock, toBlock } = await getEventPrerequisites(chainId, address);

  const getErc721EventSelector = (eventName: 'Transfer' | 'Approval' | 'ApprovalForAll') => {
    return toEventSelector(getAbiItem({ abi: ERC721_ABI, name: eventName }));
  };

  const getPermit2EventSelector = (eventName: 'Permit' | 'Approval' | 'Lockdown') => {
    return toEventSelector(getAbiItem({ abi: PERMIT2_ABI, name: eventName }));
  };

  const addressTopic = addressToTopic(address);

  const transferToFilter = { topics: [getErc721EventSelector('Transfer'), null, addressTopic], fromBlock, toBlock };
  const transferFromFilter = { topics: [getErc721EventSelector('Transfer'), addressTopic], fromBlock, toBlock };
  const approvalFilter = { topics: [getErc721EventSelector('Approval'), addressTopic], fromBlock, toBlock };
  const approvalForAllFilter = {
    topics: [getErc721EventSelector('ApprovalForAll'), addressTopic],
    fromBlock,
    toBlock,
  };

  const permit2ApprovalFilter = { topics: [getPermit2EventSelector('Approval'), addressTopic], fromBlock, toBlock };
  const permit2PermitFilter = { topics: [getPermit2EventSelector('Permit'), addressTopic], fromBlock, toBlock };
  const permit2LockdownFilter = { topics: [getPermit2EventSelector('Lockdown'), addressTopic], fromBlock, toBlock };

  const [transferTo, transferFrom, approval, approvalForAllUnpatched, permit2Approval, permit2Permit, permit2Lockdown] =
    await Promise.all([
      eventsDB.getLogs(logsProvider, transferToFilter, chainId, 'Transfer (to)'),
      eventsDB.getLogs(logsProvider, transferFromFilter, chainId, 'Transfer (from)'),
      eventsDB.getLogs(logsProvider, approvalFilter, chainId, 'Approval'),
      eventsDB.getLogs(logsProvider, approvalForAllFilter, chainId, 'ApprovalForAll'),
      eventsDB.getLogs(logsProvider, permit2ApprovalFilter, chainId, 'Permit2 Approval'),
      eventsDB.getLogs(logsProvider, permit2PermitFilter, chainId, 'Permit2 Permit'),
      eventsDB.getLogs(logsProvider, permit2LockdownFilter, chainId, 'Permit2 Lockdown'),
    ]);

  // Manually patch the ApprovalForAll events
  const approvalForAll = [
    ...approvalForAllUnpatched,
    ...generatePatchedAllowanceEvents(address, openSeaProxy ?? undefined, [
      ...approval,
      ...approvalForAllUnpatched,
      ...transferFrom,
      ...transferTo,
    ]),
  ];

  // Parse events. We put ApprovalForAll first to ensure that incorrect ERC721 contracts like CryptoStrikers are handled correctly
  const parsedEvents = [
    ...approvalForAll.map((log) => parseApprovalForAllLog(log, chainId)),
    ...approval.map((log) => parseApprovalLog(log, chainId)),
    ...permit2Approval.map((log) => parsePermit2Log(log, chainId)),
    ...permit2Permit.map((log) => parsePermit2Log(log, chainId)),
    ...permit2Lockdown.map((log) => parsePermit2Log(log, chainId)),
    ...transferFrom.map((log) => parseTransferLog(log, chainId, address)),
    ...transferTo.map((log) => parseTransferLog(log, chainId, address)),
  ];

  // We sort the events in reverse chronological order to ensure that the most recent events are processed first
  return sortTokenEventsChronologically(parsedEvents.filter((event) => !isNullish(event))).reverse();
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
        console.warn(`Failed to fetch metadata for token ${event.token} on chain ${chainId}:`, e);
        if (isNetworkError(e)) throw e;
        if (isRateLimitError(e)) throw e;
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
      const time = await blocksDB.getTimeLog(publicClient, event.time);
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

  const { logsProvider, fromBlock, toBlock } = await getEventPrerequisites(chainId, address);

  const eventSelector = toEventSelector(getAbiItem({ abi: AGW_SESSIONS_ABI, name: 'SessionCreated' }));
  const addressTopic = addressToTopic(address);

  const sessionEvents = await eventsDB.getLogs(
    logsProvider,
    { topics: [eventSelector, addressTopic], fromBlock, toBlock },
    chainId,
    'SessionCreated',
  );

  const parsedEvents = sessionEvents.map((log) => parseSessionCreatedLog(log, chainId));

  return parsedEvents;
};
