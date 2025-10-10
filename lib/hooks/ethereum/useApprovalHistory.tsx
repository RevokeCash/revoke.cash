import { useQuery } from '@tanstack/react-query';
import type { ApprovalHistoryEvent } from 'components/history/utils';
import { ADDRESS_ZERO, DUMMY_ADDRESS } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { deduplicateArray, isNullish, logSorterChronological, sortTokenEventsChronologically } from 'lib/utils';
import { isNetworkError, isRateLimitError, stringifyError } from 'lib/utils/errors';
import {
  type ApprovalTokenEvent,
  getEventKey,
  isApprovalTokenEvent,
  isRevokeEvent,
  TokenEventType,
} from 'lib/utils/events';
import { HOUR } from 'lib/utils/time';
import { createTokenContract, getTokenMetadata, throwIfSpam } from 'lib/utils/tokens';
import { getSpenderData } from 'lib/utils/whois';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { useEvents } from './events/useEvents';

export const useApprovalHistory = () => {
  const { address, selectedChainId } = useAddressPageContext();
  const { events, isLoading: eventsLoading, error: eventsError } = useEvents(address, selectedChainId);
  const publicClient = usePublicClient({ chainId: selectedChainId })!;

  const {
    data: approvalHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['approvalHistory', address, selectedChainId, events?.map(getEventKey)],
    queryFn: async () => {
      const approvalEvents = removeLoneRevokeEvents(events!.filter(isApprovalTokenEvent));
      if (approvalEvents.length === 0) return [];

      const uniqueTokenEvents = deduplicateArray(approvalEvents, (event) => event.token);

      // Get metadata for all unique tokens and filter out tokens that are marked as spam
      const metadataMap = new Map();
      await Promise.all(
        uniqueTokenEvents.map(async (event) => {
          const fullTokenEvents = (events ?? []).filter((other) => other.token === event.token);

          try {
            const contract = createTokenContract(event, publicClient)!;
            const [metadata] = await Promise.all([
              getTokenMetadata(contract, selectedChainId),
              throwIfSpam(contract, fullTokenEvents),
            ]);
            metadataMap.set(event.token, metadata);
          } catch (e) {
            console.warn(`Failed to fetch metadata for token ${event.token}:`, e);
            // If we run into any network-related errors we re-throw the error, if not, we skip the token since it is
            // likely spam or not a standard-adhering token
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
      const historyEventsWithTimestampsAndSpenderData = await Promise.all(
        historyEventsWithOldSpender.map(async (event) => {
          const [time, spenderData] = await Promise.all([
            blocksDB.getTimeLog(publicClient, event.time),
            getSpenderData(
              'oldSpender' in event.payload ? (event.payload.oldSpender as Address) : event.payload.spender,
              selectedChainId,
            ),
          ]);
          return { ...event, time, payload: { ...event.payload, spenderData } };
        }),
      );

      return sortTokenEventsChronologically(
        historyEventsWithTimestampsAndSpenderData,
      ).reverse() as ApprovalHistoryEvent[];
    },
    enabled: !isNullish(events) && !eventsLoading,
    staleTime: 1 * HOUR,
  });

  return {
    approvalHistory,
    isLoading: eventsLoading || historyLoading,
    error: eventsError || historyError,
  };
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
      // We only need to handle ERC721 approvals, since these have a special case where the old spender is needed
      if (event.type !== TokenEventType.APPROVAL_ERC721) return event;

      // Get the previously recorded spender and update the map
      const oldSpender = singleNftApprovalLastSpenderMap.get(`${event.token}-${event.payload.tokenId}`);
      singleNftApprovalLastSpenderMap.set(`${event.token}-${event.payload.tokenId}`, event.payload.spender);

      // If there was no old spender and there is no new spender, we remove the event
      if (isNullish(oldSpender) || oldSpender === ADDRESS_ZERO) {
        if (event.payload.spender === ADDRESS_ZERO) return undefined;
      } else {
        // If there is an old spender, but the current spender is the zero address, that means that an approval
        // existed and was revoked in this event, which means that we need to add the old spender to the event so
        // it can be displayed in the history table instead of the "new" spender (which is the zero address)
        if (event.payload.spender === ADDRESS_ZERO) {
          return { ...event, payload: { ...event.payload, oldSpender } };
        }
      }

      // In any other case, we don't need to update the event
      return event;
    })
    .filter((event) => !isNullish(event));
};

// If a token/spender pair has only revoke events, this is likely spam and should not be displayed
const removeLoneRevokeEvents = (events: ApprovalTokenEvent[]): ApprovalTokenEvent[] => {
  const groupedEvents = groupEventsByTokenAndSpender(events);

  const filterLoneRevokeEvents = (key: string, events: ApprovalTokenEvent[]) => {
    // We don't count DUMMY_ADDRESS (cancel signatures) and ADDRESS_ZERO (revoke ERC721 approvals) as spenders
    if (key.includes(DUMMY_ADDRESS) || key.includes(ADDRESS_ZERO)) return true;

    // If only revokes exist for this token/spender pair, we don't need to display it, since this islikely a spam revoke
    if (events.every((event) => isRevokeEvent(event))) return false;

    return true;
  };

  return Object.entries(groupedEvents)
    .filter(([key, events]) => filterLoneRevokeEvents(key, events))
    .flatMap(([_, events]) => events);
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
