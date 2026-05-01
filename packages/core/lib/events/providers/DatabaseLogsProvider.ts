import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { monitorEventsCache } from '@revoke.cash/core/db/schema/monitor';
import {
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  ERC721_TRANSFER_TOPIC,
  type Filter,
  type Log,
} from '@revoke.cash/core/events';
import { TooMuchActivityError } from '@revoke.cash/core/monitor/errors';
import { isNullish } from '@revoke.cash/core/utils';
import { and, eq, gte, inArray, lte, type SQL } from 'drizzle-orm';
import type { Address, Hash, Hex } from 'viem';
import type { LogsProvider } from './LogsProvider';

// Postgres cannot handle a result of larger than 100,000 rows due to the response size limit.
export const MAX_CACHED_RESULTS = 100_000;

// Reads logs from the `monitor.events_cache` Postgres table. When querying for Transfer events, it automatically
// restricts to tokens the user has at least one Approval/ApprovalForAll event for. This strips spam-airdrop noise
// that dominates active wallets (vitalik.eth on Polygon would otherwise return millions of Transfer rows).
export class DatabaseLogsProvider implements LogsProvider {
  constructor(public chainId: number) {}

  async getLatestBlock(): Promise<number> {
    return Number(await createViemPublicClientForChain(this.chainId).getBlockNumber());
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    const conditions: SQL[] = [
      eq(monitorEventsCache.chainId, this.chainId),
      gte(monitorEventsCache.blockNumber, filter.fromBlock),
      lte(monitorEventsCache.blockNumber, filter.toBlock),
    ];

    if (filter.address) conditions.push(eq(monitorEventsCache.address, filter.address));
    if (filter.topics[0]) conditions.push(eq(monitorEventsCache.topic0, filter.topics[0]));
    if (filter.topics[1]) conditions.push(eq(monitorEventsCache.topic1, filter.topics[1]));
    if (filter.topics[2]) conditions.push(eq(monitorEventsCache.topic2, filter.topics[2]));
    if (filter.topics[3]) conditions.push(eq(monitorEventsCache.topic3, filter.topics[3]));

    // Transfer events get the approved-tokens-only treatment. The subquery returns *token contract
    // addresses* where the user has at least one Approval/ApprovalForAll event for.
    const userAddressTopic = extractUserAddressTopic(filter);
    if (filter.topics[0] === ERC721_TRANSFER_TOPIC && userAddressTopic) {
      conditions.push(
        inArray(
          monitorEventsCache.address,
          getDb()
            .selectDistinct({ address: monitorEventsCache.address })
            .from(monitorEventsCache)
            .where(
              and(
                eq(monitorEventsCache.chainId, this.chainId),
                inArray(monitorEventsCache.topic0, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC]),
                eq(monitorEventsCache.topic1, userAddressTopic),
              ),
            ),
        ),
      );
    }

    const rows = await getDb()
      .select()
      .from(monitorEventsCache)
      .where(and(...conditions))
      .limit(MAX_CACHED_RESULTS);

    if (rows.length >= MAX_CACHED_RESULTS) {
      throw new TooMuchActivityError(this.chainId, MAX_CACHED_RESULTS);
    }

    return rows.map(formatDatabaseLog);
  }
}

// The user's address sits in topic1 (Approvals, Transfers-from, Permit2 owner) or topic2 (Transfers-to).
const extractUserAddressTopic = (filter: Filter): Hex | null => filter.topics[1] ?? filter.topics[2] ?? null;

const formatDatabaseLog = (row: typeof monitorEventsCache.$inferSelect): Log => {
  return {
    address: row.address as Address,
    topics: [row.topic0, row.topic1, row.topic2, row.topic3].filter((topic) => !isNullish(topic)) as [Hex, ...Hex[]],
    data: row.data as Hex,
    transactionHash: row.transactionHash as Hash,
    blockNumber: row.blockNumber,
    transactionIndex: row.transactionIndex,
    logIndex: row.logIndex,
    timestamp: row.timestamp ?? undefined,
  };
};
