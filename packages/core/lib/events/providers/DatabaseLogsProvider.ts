import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerEvents } from '@revoke.cash/core/db/schema/indexer';
import {
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  ERC721_TRANSFER_TOPIC,
  type Filter,
  type Log,
} from '@revoke.cash/core/events';
import { TooMuchActivityError } from '@revoke.cash/core/indexer/errors';
import { isNullish } from '@revoke.cash/core/utils';
import { and, eq, gte, inArray, lte, type SQL } from 'drizzle-orm';
import type { Address, Hash, Hex } from 'viem';
import type { LogsProvider } from './LogsProvider';

// Postgres cannot handle a result of larger than 100,000 rows due to the response size limit.
export const MAX_CACHED_RESULTS = 100_000;

export interface DatabaseLogsProviderOptions {
  // When `true`, rows flagged `reorged = true` by the scan path are included (default is `false`)
  includeReorged?: boolean;
  // when true, Transfer queries (`topic0 = ERC721_TRANSFER_TOPIC`) auto-narrow to tokens the user has at least
  // one Approval/ApprovalForAll event for (default is `true`)
  applyApprovedTokensFilter?: boolean;
}

export class DatabaseLogsProvider implements LogsProvider {
  constructor(
    public chainId: number,
    private readonly options: DatabaseLogsProviderOptions = {},
  ) {}

  async getLatestBlock(): Promise<number> {
    return Number(await createViemPublicClientForChain(this.chainId).getBlockNumber());
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    const includeReorged = this.options.includeReorged ?? false;
    const applyApprovedTokensFilter = this.options.applyApprovedTokensFilter ?? true;

    const conditions: SQL[] = [
      eq(indexerEvents.chainId, this.chainId),
      gte(indexerEvents.blockNumber, filter.fromBlock),
      lte(indexerEvents.blockNumber, filter.toBlock),
    ];

    if (!includeReorged) conditions.push(eq(indexerEvents.reorged, false));

    if (filter.address) conditions.push(eq(indexerEvents.address, filter.address));
    if (filter.topics[0]) conditions.push(eq(indexerEvents.topic0, filter.topics[0]));
    if (filter.topics[1]) conditions.push(eq(indexerEvents.topic1, filter.topics[1]));
    if (filter.topics[2]) conditions.push(eq(indexerEvents.topic2, filter.topics[2]));
    if (filter.topics[3]) conditions.push(eq(indexerEvents.topic3, filter.topics[3]));

    // Transfer events get the approved-tokens-only treatment. The subquery returns *token contract addresses*
    // where the user has at least one Approval/ApprovalForAll event for.
    const userAddressTopic = extractUserAddressTopic(filter);
    if (applyApprovedTokensFilter && filter.topics[0] === ERC721_TRANSFER_TOPIC && userAddressTopic) {
      conditions.push(
        inArray(
          indexerEvents.address,
          getDb()
            .selectDistinct({ address: indexerEvents.address })
            .from(indexerEvents)
            .where(
              and(
                eq(indexerEvents.chainId, this.chainId),
                inArray(indexerEvents.topic0, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC]),
                eq(indexerEvents.topic1, userAddressTopic),
                eq(indexerEvents.reorged, false),
              ),
            ),
        ),
      );
    }

    const rows = await getDb()
      .select()
      .from(indexerEvents)
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

const formatDatabaseLog = (row: typeof indexerEvents.$inferSelect): Log => {
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
