import { type ExplorerTransaction, fetchExplorerTransactions, getBlockRange } from '@revoke.cash/core/admin/explorer';
import { ChainId } from '@revoke.cash/core/chains/ids';
import { BATCH_REVOKE_FEE_USD_CENTS, FEES_ADDRESS } from '@revoke.cash/core/constants';
import { getDb } from '@revoke.cash/core/db/client';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, eq, gte, isNotNull, lte } from 'drizzle-orm';

// Batch revoke fees are reported by the client, so a fee that reached the fees address without a verified
// batch_revokes row is missing from revenue and VAT. Plain transfers show up in the explorer's normal transaction
// list and batched calls in its internal list, so the two client recording paths are counted separately.

const FEE_RECONCILIATION_CHAINS = [ChainId.Ethereum, ChainId.Base];

// Batch revoke fees went to revoke.eth until the premium launch
const FEES_ADDRESS_FIRST_USED_AT = new Date('2026-07-16T00:00:00.000Z');

// Rows are recorded around the fee transaction (at submit, or up to 10 minutes after it for batched calls), so they
// are loaded over a padded period and matched by hash
const RECORDED_ROW_PADDING = DAY;

export type FeePaymentPath = 'plain' | 'batched';

export interface FeeReconciliationRow {
  chainId: number;
  path: FeePaymentPath;
  receivedCount: number;
  // Received payments with a verified batch_revokes row, which is what revenue and VAT count
  inRevenueCount: number;
  missingCount: number;
  // Every batch revoke fee is the same fixed amount, so the missing value follows from the count
  missingUsdCents: number;
}

export const getFeeReconciliation = async (from: Date, to: Date): Promise<FeeReconciliationRow[]> => {
  const periodStart = from > FEES_ADDRESS_FIRST_USED_AT ? from : FEES_ADDRESS_FIRST_USED_AT;
  // Explorers reject timestamps in the future, so a period that is still running ends now
  const periodEnd = to.getTime() < Date.now() ? to : new Date();
  if (periodStart > periodEnd) return [];

  const chainRows = await Promise.all(
    FEE_RECONCILIATION_CHAINS.map((chainId) => getChainFeeReconciliation(chainId, periodStart, periodEnd)),
  );

  return chainRows.flat();
};

const getChainFeeReconciliation = async (chainId: number, from: Date, to: Date): Promise<FeeReconciliationRow[]> => {
  const blockRange = await getBlockRange(chainId, from, to);

  const [transactions, internalTransactions, verifiedFeeTransactionHashes] = await Promise.all([
    fetchExplorerTransactions(chainId, 'txlist', FEES_ADDRESS, blockRange),
    fetchExplorerTransactions(chainId, 'txlistinternal', FEES_ADDRESS, blockRange),
    getVerifiedFeeTransactionHashes(chainId, from, to),
  ]);

  return [
    buildFeeReconciliationRow(chainId, 'plain', transactions, verifiedFeeTransactionHashes),
    buildFeeReconciliationRow(chainId, 'batched', internalTransactions, verifiedFeeTransactionHashes),
  ];
};

const buildFeeReconciliationRow = (
  chainId: number,
  path: FeePaymentPath,
  transactions: ExplorerTransaction[],
  verifiedFeeTransactionHashes: Set<string>,
): FeeReconciliationRow => {
  const receivedHashes = deduplicateArray(
    transactions.filter(isFeePayment).map((transaction) => transaction.hash.toLowerCase()),
  );
  const inRevenueCount = receivedHashes.filter((hash) => verifiedFeeTransactionHashes.has(hash)).length;
  const missingCount = receivedHashes.length - inRevenueCount;

  return {
    chainId,
    path,
    receivedCount: receivedHashes.length,
    inRevenueCount,
    missingCount,
    missingUsdCents: missingCount * BATCH_REVOKE_FEE_USD_CENTS,
  };
};

const isFeePayment = (transaction: ExplorerTransaction): boolean => {
  return (
    transaction.isError === '0' &&
    BigInt(transaction.value) > 0n &&
    transaction.to.toLowerCase() === FEES_ADDRESS.toLowerCase()
  );
};

const getVerifiedFeeTransactionHashes = async (chainId: number, from: Date, to: Date): Promise<Set<string>> => {
  const rows = await getDb()
    .select({ feeTransactionHash: batchRevokes.feeTransactionHash })
    .from(batchRevokes)
    .where(
      and(
        eq(batchRevokes.chainId, chainId),
        isNotNull(batchRevokes.feeTransactionHash),
        isNotNull(batchRevokes.feeVerifiedAt),
        gte(batchRevokes.timestamp, new Date(from.getTime() - RECORDED_ROW_PADDING)),
        lte(batchRevokes.timestamp, new Date(to.getTime() + RECORDED_ROW_PADDING)),
      ),
    );

  return new Set(rows.map((row) => row.feeTransactionHash!.toLowerCase()));
};
