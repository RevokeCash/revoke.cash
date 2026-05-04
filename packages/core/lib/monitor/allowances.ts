import { AllowanceType, getAllowancesFromEvents, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { createViemPublicClientForChain, type DocumentedChainId } from '@revoke.cash/core/chains';
import { getTokenEvents } from '@revoke.cash/core/chains/events';
import { type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { monitorAllowanceState, monitorAllowances, monitorScanState } from '@revoke.cash/core/db/schema/monitor';
import { type Log, parseLog } from '@revoke.cash/core/events';
import { DatabaseLogsProvider } from '@revoke.cash/core/events/providers';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Address, getAddress } from 'viem';
import { toLowercaseAddress } from '../utils';
import { REORG_DEPTH } from './scan';

export interface RecomputeAllowancesResult {
  skipped: boolean;
  computedCount: number;
  affectedTokenCount: number;
  durationMs: number;
}

// Triggered after successful new event insertions or reorg-induced removals. Only recomputes allowances that
// might be affected by the new or reorged events
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

  const newLogs = await readNewLogs(address, chainId, recomputeFromBlock, newCursor);
  const affectedTokens = extractAffectedTokens(newLogs, address, chainId);

  if (affectedTokens.size === 0) {
    // No allowance-relevant events (fresh or reorged) in the rewind window. Advance the cursor
    // anyway — otherwise the rewind window keeps growing on every subsequent scan with no payoff.
    await upsertAllowanceState(db, address, chainId, newCursor);
    return { skipped: true, computedCount: 0, affectedTokenCount: 0, durationMs: Date.now() - start };
  }

  // Fetch all events for the wallet, then scoped to only events on affected tokens to recompute allowances for
  const publicClient = createViemPublicClientForChain(chainId);
  const { events: allEvents } = await getTokenEvents(chainId, address, new DatabaseLogsProvider(chainId));
  const scopedEvents = allEvents.filter((event) => affectedTokens.has(toLowercaseAddress(event.token)));

  // Recompute allowances ONLY for the affected tokens
  const allowances = await getAllowancesFromEvents(address, scopedEvents, publicClient, chainId);
  const rows = buildAllowanceRows(address, chainId, allowances);

  // Delete all allowances for the affected tokens, then insert the newly recomputed allowances
  await getTransactionalDb().transaction(async (trx) => {
    await trx
      .delete(monitorAllowances)
      .where(
        and(
          eq(monitorAllowances.address, address),
          eq(monitorAllowances.chainId, chainId),
          inArray(monitorAllowances.tokenAddress, [...affectedTokens].map(getAddress)),
        ),
      );

    if (rows.length > 0) {
      await trx.insert(monitorAllowances).values(rows);
    }

    // Advance cursor + clear failure state atomically with the per-token replace above.
    await upsertAllowanceState(trx, address, chainId, newCursor);
  });

  return {
    skipped: false,
    computedCount: rows.length,
    affectedTokenCount: affectedTokens.size,
    durationMs: Date.now() - start,
  };
};

const readNewLogs = async (address: Address, chainId: DocumentedChainId, rewindFrom: number, toBlock: number) => {
  const userTopic = addressToTopic(address);
  const provider = new DatabaseLogsProvider(chainId, { includeReorged: true, applyApprovedTokensFilter: false });
  // We don't apply a topic0 filter, because the events_cache table only contains allowance-relevant topic0s
  return provider.getLogs({
    topics: [null, userTopic],
    fromBlock: rewindFrom + 1,
    toBlock,
  });
};

const extractAffectedTokens = (logs: Log[], owner: Address, chainId: number): Set<Address> => {
  const tokens = new Set<Address>();
  for (const log of logs) {
    const event = parseLog(log, chainId, owner);
    // `event` is undefined for malformed logs or for topic0s `parseLog` doesn't recognize.
    if (event) tokens.add(toLowercaseAddress(event.token));
  }
  return tokens;
};

// Both the skip path and the recompute success path treat "advanced cursor + cleared failure
// state" as a single atomic write — the only difference is whether a transaction is in flight.
// Caller passes `getDb()` for the bare skip path or `trx` from inside the recompute transaction.
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
