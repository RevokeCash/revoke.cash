import { Injectable } from '@nestjs/common';
import { getDb } from '@revoke.cash/core/db/client';
import { monitorScanState } from '@revoke.cash/core/db/schema/monitor';
import { premiumSubscriptionAddresses, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { and, asc, eq, exists, gte, isNull, lte, sql } from 'drizzle-orm';
import type { Address } from 'viem';

export interface ScanCandidate {
  address: Address;
  chainId: number;
}

@Injectable()
export class SubscribersService {
  /**
   * Find (address, chainId) pairs ready to scan, ordered by `next_run_at`.
   *
   * Eligibility:
   *   - `next_run_at <= now()` (the scan is due)
   *   - `disabled_at IS NULL` (not manually paused)
   *   - At least one currently-active premium subscription covers the address
   *
   * Subscriptions that have ended or had their address removed are excluded automatically
   * via the EXISTS clause — no cleanup needed in `monitor.scan_state` when memberships change.
   */
  async findReadyToScan(limit: number): Promise<ScanCandidate[]> {
    const db = getDb();

    const activeMembershipQuery = db
      .select({ one: sql<number>`1` })
      .from(premiumSubscriptionAddresses)
      .innerJoin(premiumSubscriptions, eq(premiumSubscriptions.id, premiumSubscriptionAddresses.subscriptionId))
      .where(
        and(
          eq(premiumSubscriptionAddresses.address, monitorScanState.address),
          lte(premiumSubscriptions.startsAt, sql`now()`),
          gte(premiumSubscriptions.endsAt, sql`now()`),
        ),
      );

    return db
      .select({
        address: monitorScanState.address,
        chainId: monitorScanState.chainId,
      })
      .from(monitorScanState)
      .where(
        and(
          lte(monitorScanState.nextRunAt, sql`now()`),
          isNull(monitorScanState.disabledAt),
          exists(activeMembershipQuery),
        ),
      )
      .orderBy(asc(monitorScanState.nextRunAt))
      .limit(limit);
  }
}
