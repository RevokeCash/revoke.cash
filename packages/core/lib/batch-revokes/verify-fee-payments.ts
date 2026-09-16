import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { FEES_ADDRESS } from '@revoke.cash/core/constants';
import { getDb } from '@revoke.cash/core/db/client';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import {
  type Address,
  BaseError,
  type Hash,
  isAddressEqual,
  type PublicClient,
  TransactionReceiptNotFoundError,
} from 'viem';

// A reported fee transaction that is still not on chain after this long is treated as dropped or made up
const NOT_FOUND_GRACE_PERIOD = DAY;

export interface VerifyBatchRevokeFeePaymentsResult {
  processed: number;
  verified: number;
  failed: number;
  pending: number;
  errors: number;
}

export type FeePaymentVerdict = { outcome: 'verified' } | { outcome: 'failed'; error: string } | { outcome: 'pending' };

// Batch revokes are client-reported, so a paid fee only counts as revenue once its transaction is found
// on chain and moved value to the fees address
export const verifyBatchRevokeFeePayments = async (limit = 100): Promise<VerifyBatchRevokeFeePaymentsResult> => {
  const db = getDb();

  const unverifiedRows = await db.query.batchRevokes.findMany({
    where: and(
      isNotNull(batchRevokes.feeTransactionHash),
      isNull(batchRevokes.feeVerifiedAt),
      isNull(batchRevokes.feeVerificationError),
    ),
    orderBy: asc(batchRevokes.id),
    columns: { id: true, chainId: true, feeTransactionHash: true, timestamp: true },
    limit,
  });

  const result: VerifyBatchRevokeFeePaymentsResult = {
    processed: unverifiedRows.length,
    verified: 0,
    failed: 0,
    pending: 0,
    errors: 0,
  };

  for (const row of unverifiedRows) {
    try {
      const verdict = await verifyFeePayment(row.chainId, row.feeTransactionHash as Hash, row.timestamp);

      if (verdict.outcome === 'verified') {
        await db.update(batchRevokes).set({ feeVerifiedAt: new Date() }).where(eq(batchRevokes.id, row.id));
      } else if (verdict.outcome === 'failed') {
        await db.update(batchRevokes).set({ feeVerificationError: verdict.error }).where(eq(batchRevokes.id, row.id));
      }

      result[verdict.outcome] += 1;
    } catch (error) {
      console.error(`Failed to verify batch revoke fee payment ${row.id}:`, error);
      result.errors += 1;
    }
  }

  return result;
};

export const verifyFeePayment = async (
  chainId: number,
  transactionHash: Hash,
  reportedAt: Date,
  feeRecipients: Address[] = [FEES_ADDRESS],
): Promise<FeePaymentVerdict> => {
  const isPastGracePeriod = Date.now() - reportedAt.getTime() > NOT_FOUND_GRACE_PERIOD;

  try {
    const client = createViemPublicClientForChain(chainId);
    const check = await verifyFeePaymentOnChain(client, transactionHash, feeRecipients);

    if (check.outcome !== 'not_found') return check;
    if (isPastGracePeriod) return { outcome: 'failed', error: 'Transaction not found within a day of reporting' };
    return { outcome: 'pending' };
  } catch (error) {
    if (!isPastGracePeriod) throw error;
    // Provider errors can carry the RPC URL, so only the short message is stored
    const message = error instanceof BaseError ? error.shortMessage : error instanceof Error ? error.name : 'Unknown';
    return { outcome: 'failed', error: `Verification error: ${message}` };
  }
};

export type FeePaymentCheck = { outcome: 'verified' } | { outcome: 'failed'; error: string } | { outcome: 'not_found' };

export const verifyFeePaymentOnChain = async (
  client: PublicClient,
  transactionHash: Hash,
  feeRecipients: Address[] = [FEES_ADDRESS],
): Promise<FeePaymentCheck> => {
  const receipt = await client.getTransactionReceipt({ hash: transactionHash }).catch((error: unknown) => {
    if (error instanceof TransactionReceiptNotFoundError) return null;
    throw error;
  });

  if (!receipt) return { outcome: 'not_found' };

  if (receipt.status !== 'success') {
    return { outcome: 'failed', error: 'Transaction reverted' };
  }

  const recipient = receipt.to;
  if (recipient && feeRecipients.some((feeRecipient) => isAddressEqual(feeRecipient, recipient))) {
    const transaction = await client.getTransaction({ hash: transactionHash });
    if (transaction.value > 0n) return { outcome: 'verified' };
    return { outcome: 'failed', error: 'Transaction to the fees address carries no value' };
  }

  const balanceChanges = await Promise.all(
    feeRecipients.map(async (feeRecipient) => {
      const [balanceBefore, balanceAfter] = await Promise.all([
        client.getBalance({ address: feeRecipient, blockNumber: receipt.blockNumber - 1n }),
        client.getBalance({ address: feeRecipient, blockNumber: receipt.blockNumber }),
      ]);
      return balanceAfter - balanceBefore;
    }),
  );

  if (balanceChanges.some((balanceChange) => balanceChange > 0n)) return { outcome: 'verified' };
  return { outcome: 'failed', error: 'No value reached the fees address in the transaction block' };
};
