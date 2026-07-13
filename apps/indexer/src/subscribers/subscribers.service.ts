import { Injectable } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { activeSubscriptionsQuery } from '@revoke.cash/core/premium/subscriptions';
import { and, asc, exists, inArray, isNull, lte, sql } from 'drizzle-orm';
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
   *   - The chain is still present in the chain config (rows can outlive a chain's removal)
   *   - At least one currently-active premium subscription covers the address
   *
   * Subscriptions that have ended or had their address removed are excluded automatically
   * via the EXISTS clause — no cleanup needed in `indexer.events_state` when memberships change.
   */
  async findReadyToIndex(limit: number): Promise<EventsCandidate[]> {
    const db = getDb();

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
          inArray(indexerEventsState.chainId, [...ORDERED_CHAINS]),
          exists(activeSubscriptionsQuery(db, indexerEventsState.address)),
        ),
      )
      .orderBy(asc(indexerEventsState.nextRunAt))
      .limit(limit);
  }
}
