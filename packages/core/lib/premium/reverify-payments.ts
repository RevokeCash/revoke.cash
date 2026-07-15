import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { premiumPayments } from '@revoke.cash/core/db/schema/premium';
import { HOUR } from '@revoke.cash/core/utils/time';
import { and, eq, gte, inArray, isNotNull, lte, ne } from 'drizzle-orm';
import { type Hash, TransactionReceiptNotFoundError } from 'viem';
import { getPaymentConfig } from './payment-config';
import type { PremiumPaymentRecord } from './payments';
import { transitionPaymentAndRebuild } from './subscriptions';
import { findMatchingTransferTxHash } from './verify-payment';

// We do not wait for confirmations before marking a payment as confirmed. Instead we re-verify recently confirmed
// payments and reverse their effects if they are no longer present on-chain
const REVERIFICATION_WINDOW_HOURS = 24;
const REVERIFICATION_GRACE_HOURS = 1;

interface ReverifyRecentPaymentsResult {
  checked: number;
  intact: number;
  rematched: number;
  reversed: number;
  reconfirmed: number;
  errors: number;
}

export const reverifyRecentPayments = async (): Promise<ReverifyRecentPaymentsResult> => {
  const db = getDb();

  const recentPayments = await db.query.premiumPayments.findMany({
    where: and(
      inArray(premiumPayments.status, ['confirmed', 'reversed']),
      isNotNull(premiumPayments.matchedTxHash),
      gte(premiumPayments.confirmedAt, new Date(Date.now() - REVERIFICATION_WINDOW_HOURS * HOUR)),
      lte(premiumPayments.confirmedAt, new Date(Date.now() - REVERIFICATION_GRACE_HOURS * HOUR)),
    ),
    orderBy: (payments, { asc }) => [asc(payments.confirmedAt)],
  });

  const result: ReverifyRecentPaymentsResult = {
    checked: recentPayments.length,
    intact: 0,
    rematched: 0,
    reversed: 0,
    reconfirmed: 0,
    errors: 0,
  };

  for (const payment of recentPayments) {
    try {
      const outcome = await reverifyPayment(payment);
      result[outcome] += 1;
    } catch (error) {
      // RPC or database failure: never change a payment on a failed lookup, the next sweep retries
      console.error(`Failed to re-verify payment ${payment.id}:`, error);
      result.errors += 1;
    }
  }

  return result;
};

type ReverificationOutcome = 'intact' | 'rematched' | 'reversed' | 'reconfirmed';

const reverifyPayment = async (payment: PremiumPaymentRecord): Promise<ReverificationOutcome> => {
  const transferExists = await isTransactionStillOnChain(payment.chainId, payment.matchedTxHash!);

  if (payment.status === 'reversed') {
    if (transferExists && (await transitionPaymentInTransaction(payment.id, 'reversed', 'confirmed'))) {
      return 'reconfirmed';
    }
    return 'intact';
  }

  if (transferExists) return 'intact';

  // The recorded transaction is gone. If an equivalent transfer exists under a different hash
  // (re-sent, or re-included differently after the reorg), re-match it instead of reversing.
  const replacementTxHash = await findReplacementTxHash(payment);
  if (replacementTxHash) {
    await getDb()
      .update(premiumPayments)
      .set({ matchedTxHash: replacementTxHash })
      .where(and(eq(premiumPayments.id, payment.id), eq(premiumPayments.status, 'confirmed')));
    return 'rematched';
  }

  const reversalSucceeded = await transitionPaymentInTransaction(payment.id, 'confirmed', 'reversed');
  return reversalSucceeded ? 'reversed' : 'intact';
};

const transitionPaymentInTransaction = async (
  paymentId: string,
  fromStatus: 'confirmed' | 'reversed',
  toStatus: 'confirmed' | 'reversed',
): Promise<boolean> => {
  const db = getTransactionalDb();
  return db.transaction((trx) => transitionPaymentAndRebuild(trx, paymentId, fromStatus, toStatus));
};

const isTransactionStillOnChain = async (chainId: number, txHash: Hash): Promise<boolean> => {
  const publicClient = createViemPublicClientForChain(chainId);

  try {
    await publicClient.getTransactionReceipt({ hash: txHash });
    return true;
  } catch (error) {
    if (error instanceof TransactionReceiptNotFoundError) return false;
    throw error;
  }
};

const findReplacementTxHash = async (payment: PremiumPaymentRecord): Promise<Hash | null> => {
  const paymentConfig = getPaymentConfig(payment.chainId);
  if (!paymentConfig) return null;

  const matchedTxHash = await findMatchingTransferTxHash(payment, payment.ownerAddress, paymentConfig.paymentAddress);
  if (!matchedTxHash) return null;

  // A transfer already credited to another payment cannot be reused (unique index on the hash)
  const existingTxUse = await getDb().query.premiumPayments.findFirst({
    where: and(eq(premiumPayments.matchedTxHash, matchedTxHash), ne(premiumPayments.id, payment.id)),
    columns: { id: true },
  });

  return existingTxUse ? null : matchedTxHash;
};
