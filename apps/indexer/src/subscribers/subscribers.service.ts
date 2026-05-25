import { Injectable } from '@nestjs/common';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { premiumSubscriptionAddresses, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { and, asc, eq, exists, gte, isNull, lte, sql } from 'drizzle-orm';
import type { Address } from 'viem';

export interface EventsCandidate {
  address: Address;
  chainId: number;
  nextRunAt: Date;
}

@Injectable()
export class SubscribersService {
  /**
   * Find (address, chainId) pairs ready to index, ordered by `next_run_at`.
   *
   * Eligibility:
   *   - `next_run_at <= now()` (the indexing run is due)
   *   - `disabled_at IS NULL` (not manually paused)
   *   - At least one currently-active premium subscription covers the address
   *
   * Subscriptions that have ended or had their address removed are excluded automatically
   * via the EXISTS clause — no cleanup needed in `indexer.events_state` when memberships change.
   */
  async findReadyToIndex(limit: number): Promise<EventsCandidate[]> {
    const db = getDb();

    const activeMembershipQuery = db
      .select({ one: sql<number>`1` })
      .from(premiumSubscriptionAddresses)
      .innerJoin(premiumSubscriptions, eq(premiumSubscriptions.id, premiumSubscriptionAddresses.subscriptionId))
      .where(
        and(
          eq(premiumSubscriptionAddresses.address, indexerEventsState.address),
          lte(premiumSubscriptions.startsAt, sql`now()`),
          gte(premiumSubscriptions.endsAt, sql`now()`),
        ),
      );

    return db
      .select({
        address: indexerEventsState.address,
        chainId: indexerEventsState.chainId,
        nextRunAt: indexerEventsState.nextRunAt,
      })
      .from(indexerEventsState)
      .where(
        and(
          lte(indexerEventsState.nextRunAt, sql`now()`),
          isNull(indexerEventsState.disabledAt),
          exists(activeMembershipQuery),
        ),
      )
      .orderBy(asc(indexerEventsState.nextRunAt))
      .limit(limit);
  }
}
