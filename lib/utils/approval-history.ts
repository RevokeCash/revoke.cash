import type { ApprovalHistoryEvent } from 'components/history/utils';
import { ADDRESS_ZERO, DUMMY_ADDRESS } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import { deduplicateArray, isNullish, logSorterChronological, sortTokenEventsChronologically } from 'lib/utils';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { isNetworkError, isRateLimitError, stringifyError } from 'lib/utils/errors';
import {
  type ApprovalTokenEvent,
  isApprovalTokenEvent,
  isRevokeEvent,
  type TokenEvent,
  TokenEventType,
} from 'lib/utils/events';
import { createTokenContract, getTokenMetadata, throwIfSpam } from 'lib/utils/tokens';
import type { PublicClient } from 'viem';

interface GetApprovalHistoryForChainOptions {
  chainId: number;
  events?: TokenEvent[];
  publicClient?: PublicClient;
}

export const getApprovalHistoryForChain = async ({
  chainId,
  events,
  publicClient,
}: GetApprovalHistoryForChainOptions): Promise<ApprovalHistoryEvent[]> => {
  const safeEvents = Array.isArray(events) ? events : [];
  const approvalEvents = removeLoneRevokeEvents(safeEvents.filter(isApprovalTokenEvent));
  if (approvalEvents.length === 0) return [];

  const chainPublicClient = publicClient ?? createViemPublicClientForChain(chainId);
  const uniqueTokenEvents = deduplicateArray(approvalEvents, (event) => event.token);

  // Get metadata for all unique tokens and filter out tokens that are marked as spam
  const metadataMap = new Map();
  await Promise.all(
    uniqueTokenEvents.map(async (event) => {
      const fullTokenEvents = safeEvents.filter((other) => other.token === event.token);

      try {
        const contract = createTokenContract(event, chainPublicClient)!;
        const [metadata] = await Promise.all([
          getTokenMetadata(contract, chainId),
          throwIfSpam(contract, fullTokenEvents),
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

  // Add metadata to the events and filter out any events that failed metadata lookup (and therefore are spam)
  const historyEventsWithMetadata = approvalEvents
    .map((event) => ({ ...event, metadata: metadataMap.get(event.token) }))
    .filter((event) => !isNullish(event.metadata));

  const historyEventsWithOldSpender = processErc721ApprovalEvents(historyEventsWithMetadata);

  // Only fetch timestamps for the events that will actually be displayed in the history table
  const historyEventsWithTimestamps = await Promise.all(
    historyEventsWithOldSpender.map(async (event) => {
      const time = await blocksDB.getTimeLog(chainPublicClient, event.time);
      return { ...event, time };
    }),
  );

  return sortTokenEventsChronologically(historyEventsWithTimestamps).reverse() as ApprovalHistoryEvent[];
};

// ERC721_APPROVAL events are always emitted on token transfers with an ADDRESS_ZERO spender, so we need to look at
// the spender *before* that event to determine whether an existing approval was revoked in that event.
// If so, we need to add the old spender to the event so it can be displayed in the history table instead of the
// "new" spender (which is the zero address).
// If not, we remove the event, since it is superfluous.
const processErc721ApprovalEvents = (events: ApprovalHistoryEvent[]): ApprovalHistoryEvent[] => {
  const singleNftApprovalLastSpenderMap = new Map();

  return events
    .sort((a, b) => logSorterChronological(a.rawLog, b.rawLog))
    .map((event) => {
      if (event.type !== TokenEventType.APPROVAL_ERC721) return event;

      const oldSpender = singleNftApprovalLastSpenderMap.get(`${event.token}-${event.payload.tokenId}`);
      singleNftApprovalLastSpenderMap.set(`${event.token}-${event.payload.tokenId}`, event.payload.spender);

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
    const key =
      'oldSpender' in event.payload
        ? `${event.token}-${event.payload.oldSpender}`
        : `${event.token}-${event.payload.spender}`;
    acc[key] = [...(acc[key] || []), event];
    return acc;
  }, {});
};
