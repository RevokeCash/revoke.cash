import { AllowanceType, getAllowancesFromEvents, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import blocksCache from '@revoke.cash/core/cache/blocks';
import { createViemPublicClientForChain, type DocumentedChainId } from '@revoke.cash/core/chains';
import { type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { monitorAllowanceState, monitorAllowances, monitorScanState } from '@revoke.cash/core/db/schema/monitor';
import {
  type EnrichedTokenEvent,
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  ERC721_TRANSFER_TOPIC,
  PERMIT2_APPROVAL_TOPIC,
  PERMIT2_LOCKDOWN_TOPIC,
  PERMIT2_PERMIT_TOPIC,
  parseLog,
  type TokenEvent,
} from '@revoke.cash/core/events';
import { DatabaseLogsProvider } from '@revoke.cash/core/events/providers';
import { addressToTopic, sortTokenEventsChronologically } from '@revoke.cash/core/events/utils';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Address, PublicClient } from 'viem';
import { isNullish } from '../utils';
import { findAffectedTokens } from './affected-tokens';
import { REORG_DEPTH } from './scan';

export interface RecomputeAllowancesResult {
  skipped: boolean;
  computedCount: number;
  affectedTokenCount: number;
  durationMs: number;
}

// Triggered after successful new event insertions or reorg-induced removals. Only recomputes
// allowances for tokens whose events landed (or got reorged) in the recompute window since the
// last successful compute. Per-token reads keep every query bounded — no wallet-wide event
// fetch — so the recompute survives heavy wallets where total event volume exceeds Postgres's
// 100k-row protocol cap on the libpq response.
export const recomputeAllowances = async (
  address: Address,
  chainId: DocumentedChainId,
): Promise<RecomputeAllowancesResult> => {
  const start = Date.now();
  const db = getDb();

  const [allowanceState, scanState] = await Promise.all([
    db.query.monitorAllowanceState.findFirst({
      where: and(eq(monitorAllowanceState.address, address), eq(monitorAllowanceState.chainId, chainId)),
    }),
    db.query.monitorScanState.findFirst({
      where: and(eq(monitorScanState.address, address), eq(monitorScanState.chainId, chainId)),
      columns: { lastToBlock: true },
    }),
  ]);

  const oldCursor = allowanceState?.computedToBlock ?? null;
  const newCursor = scanState?.lastToBlock;

  if (!newCursor) {
    throw new Error(`recomputeAllowances called without a scan_state cursor for ${address} on chain ${chainId}`);
  }

  // take reorg depth into account when reading new logs
  const recomputeFromBlock = Math.max((oldCursor ?? 0) - REORG_DEPTH, -1);

  const affectedTokens = await findAffectedTokens(address, chainId, recomputeFromBlock + 1, newCursor);

  if (affectedTokens.length === 0) {
    // No allowance-relevant events (fresh or reorged) in the recompute window. Advance the cursor
    // anyway — otherwise the recompute window keeps growing on every subsequent scan with no payoff.
    await upsertAllowanceState(db, address, chainId, newCursor);
    return { skipped: true, computedCount: 0, affectedTokenCount: 0, durationMs: Date.now() - start };
  }

  const publicClient = createViemPublicClientForChain(chainId);
  const perTokenRawEvents = await mapAsyncBounded(affectedTokens, 10, (token) =>
    fetchRawEventsForToken(address, chainId, token, newCursor),
  );

  const scopedEvents = await attachTimestampsAndPlaceholderMetadata(
    sortTokenEventsChronologically(perTokenRawEvents.flat()).reverse(),
    publicClient,
  );

  const allowances = await getAllowancesFromEvents(address, scopedEvents, publicClient, chainId);
  const rows = buildAllowanceRows(address, chainId, allowances);

  await getTransactionalDb().transaction(async (trx) => {
    await trx
      .delete(monitorAllowances)
      .where(
        and(
          eq(monitorAllowances.address, address),
          eq(monitorAllowances.chainId, chainId),
          inArray(monitorAllowances.tokenAddress, affectedTokens),
        ),
      );

    if (rows.length > 0) {
      await trx.insert(monitorAllowances).values(rows);
    }

    await upsertAllowanceState(trx, address, chainId, newCursor);
  });

  return {
    skipped: false,
    computedCount: rows.length,
    affectedTokenCount: affectedTokens.length,
    durationMs: Date.now() - start,
  };
};

// Indexer-side enrichment is intentionally minimal: resolve the block timestamp (needed for
// `monitor.allowances.last_updated_timestamp`) and attach an empty metadata placeholder to satisfy
// the `EnrichedTokenEvent` type. Real metadata + spam filtering happens at read time.
const attachTimestampsAndPlaceholderMetadata = async (
  events: TokenEvent[],
  publicClient: PublicClient,
): Promise<EnrichedTokenEvent[]> => {
  return Promise.all(
    events.map(async (event) => {
      const time = await blocksCache.getTimeLog(publicClient, event.time);
      return { ...event, time, metadata: { symbol: '' } } satisfies EnrichedTokenEvent;
    }),
  );
};

const fetchRawEventsForToken = async (
  address: Address,
  chainId: DocumentedChainId,
  tokenAddress: Address,
  toBlock: number,
): Promise<TokenEvent[]> => {
  const provider = new DatabaseLogsProvider(chainId);
  const userTopic = addressToTopic(address);
  const tokenTopic = addressToTopic(tokenAddress);

  const TOKEN_EMITTED_TOPICS = [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC, ERC721_TRANSFER_TOPIC];
  const PERMIT2_INDEXED_TOPICS = [PERMIT2_APPROVAL_TOPIC, PERMIT2_PERMIT_TOPIC];

  const logsByFilter = await Promise.all([
    // Token-emitted: emitter = the token contract, user owns at topic1.
    ...TOKEN_EMITTED_TOPICS.map((topic0) =>
      provider.getLogs({ address: tokenAddress, topics: [topic0, userTopic], fromBlock: 0, toBlock }),
    ),
    // Permit2-emitted: emitter is any Permit2 deployment, user at topic1, token at topic2.
    ...PERMIT2_INDEXED_TOPICS.map((topic0) =>
      provider.getLogs({ topics: [topic0, userTopic, tokenTopic], fromBlock: 0, toBlock }),
    ),
    // Permit2 Lockdown — read user-wide, filter to this token after the JS decode below.
    provider.getLogs({ topics: [PERMIT2_LOCKDOWN_TOPIC, userTopic], fromBlock: 0, toBlock }),
  ]);

  return logsByFilter
    .flat()
    .map((log) => parseLog(log, chainId, address))
    .filter((event) => !isNullish(event))
    .filter((event) => event.token === tokenAddress);
};

const buildAllowanceRows = (
  address: Address,
  chainId: DocumentedChainId,
  allowances: TokenAllowanceData[],
): Array<typeof monitorAllowances.$inferInsert> => {
  return allowances.filter((data) => data.payload).map((data) => buildAllowanceRow(address, chainId, data));
};

const buildAllowanceRow = (
  address: Address,
  chainId: DocumentedChainId,
  data: TokenAllowanceData,
): typeof monitorAllowances.$inferInsert => {
  const payload = data.payload;
  if (!payload) throw new Error('expected payload on allowance');

  const common = {
    chainId,
    address,
    tokenAddress: data.contract.address,
    spenderAddress: payload.spender,
    // `payload.type` is the `AllowanceType` enum, whose values are already strings (`'erc20'`,
    // `'erc721_single'`, etc.). Stored verbatim — no translation needed.
    approvalType: payload.type,
    lastUpdatedBlock: payload.lastUpdated.blockNumber,
    lastUpdatedTxHash: payload.lastUpdated.transactionHash,
    lastUpdatedTimestamp: payload.lastUpdated.timestamp,
  };

  switch (payload.type) {
    case AllowanceType.ERC20:
      return { ...common, amount: payload.amount };
    case AllowanceType.ERC721_SINGLE:
      return { ...common, tokenId: payload.tokenId };
    case AllowanceType.ERC721_ALL:
      return { ...common, approved: true };
    case AllowanceType.PERMIT2:
      return {
        ...common,
        amount: payload.amount,
        permit2Address: payload.permit2Address,
        expiration: payload.expiration,
      };
  }
};

const upsertAllowanceState = async (
  writer: DatabaseWriter,
  address: Address,
  chainId: DocumentedChainId,
  cursor: number,
): Promise<void> => {
  const successValues = {
    computedAt: new Date(),
    computedToBlock: cursor,
    consecutiveFailures: 0,
    lastError: null,
  };
  await writer
    .insert(monitorAllowanceState)
    .values({ address, chainId, ...successValues })
    .onConflictDoUpdate({
      target: [monitorAllowanceState.address, monitorAllowanceState.chainId],
      set: successValues,
    });
};

export const recordAllowanceFailure = async (
  address: Address,
  chainId: DocumentedChainId,
  error: unknown,
): Promise<void> => {
  const message = parseErrorMessage(error);
  await getDb()
    .insert(monitorAllowanceState)
    .values({ address, chainId, consecutiveFailures: 1, lastError: message })
    .onConflictDoUpdate({
      target: [monitorAllowanceState.address, monitorAllowanceState.chainId],
      set: {
        consecutiveFailures: sql`${monitorAllowanceState.consecutiveFailures} + 1`,
        lastError: message,
      },
    });
};
