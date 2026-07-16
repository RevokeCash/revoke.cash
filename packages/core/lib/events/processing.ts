import { ADDRESS_ZERO, DUMMY_ADDRESS } from '@revoke.cash/core/constants';
import { type ApprovalTokenEvent, isRevokeEvent, TokenEventType } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import type { Address } from 'viem';
import { logSorterChronological } from './utils';

// ERC721 Approval events are always emitted on token transfers with an ADDRESS_ZERO spender, so we need to look at
// the spender *before* that event to determine whether an existing approval was revoked in that event.
// If so, we set the oldSpender on the event so it can be displayed in the history table instead of the
// "new" spender (which is the zero address).
// If not, we remove the event, since it is superfluous.
export const processErc721ApprovalEvents = (events: ApprovalTokenEvent[]): ApprovalTokenEvent[] => {
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

// If a token/spender pair has only revoke events, this is likely spam and should not be displayed.
export const removeLoneRevokeEvents = (events: ApprovalTokenEvent[]): ApprovalTokenEvent[] => {
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
