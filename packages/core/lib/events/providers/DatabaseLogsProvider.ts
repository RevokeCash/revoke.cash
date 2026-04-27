import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { monitorEventsCache } from '@revoke.cash/core/db/schema/monitor';
import type { Filter, Log } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { and, eq, gte, lte, type SQL } from 'drizzle-orm';
import type { Address, Hash, Hex } from 'viem';
import type { LogsProvider } from './LogsProvider';

/**
 * Reads logs from the `monitor.events_cache` Postgres table. Pluggable anywhere a
 * `LogsProvider` is expected — e.g. `getTokenEvents(chainId, address, new DatabaseLogsProvider(chainId))`.
 *
 * This provider does not refresh the cache; the caller is responsible for ensuring the
 * cache is current (e.g. by invoking `scanAddressChain` before reading).
 */
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

    const rows = await getDb()
      .select()
      .from(monitorEventsCache)
      .where(and(...conditions));

    return rows.map(formatDatabaseLog);
  }
}

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
