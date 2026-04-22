import {
  type ApprovalTokenEvent,
  type Enriched,
  type EnrichedTokenEvent,
  isApprovalTokenEvent,
} from '@revoke.cash/core/events';
import { sortTokenEventsChronologically } from '@revoke.cash/core/events/utils';

export const getApprovalHistoryForChain = (events: EnrichedTokenEvent[] = []): Enriched<ApprovalTokenEvent>[] => {
  const approvalEvents = events.filter(isApprovalTokenEvent);
  if (approvalEvents.length === 0) return [];

  // Events are already enriched: metadata attached, timestamps resolved, spam filtered,
  // lone revokes removed, ERC721 spurious revokes filtered, oldSpender annotated.
  // Just filter to approvals and sort.
  return sortTokenEventsChronologically(approvalEvents).reverse() as Enriched<ApprovalTokenEvent>[];
};
