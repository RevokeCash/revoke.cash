import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { premiumPayments } from '@revoke.cash/core/db/schema/premium';
import { HOUR } from '@revoke.cash/core/utils/time';
import { and, gte, inArray, isNotNull, lte } from 'drizzle-orm';
import { type Hash, TransactionReceiptNotFoundError } from 'viem';
import type { PremiumPaymentRecord } from './payments';
import { transitionPaymentAndRebuild } from './subscriptions';

// We do not wait for confirmations before marking a payment as confirmed. Instead we re-verify recently confirmed
// payments and reverse their effects if they are no longer present on-chain
const REVERIFICATION_WINDOW_HOURS = 24;
const REVERIFICATION_GRACE_HOURS = 1;

interface ReverifyRecentPaymentsResult {
  checked: number;
  intact: number;
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

type ReverificationOutcome = 'intact' | 'reversed' | 'reconfirmed';

const reverifyPayment = async (payment: PremiumPaymentRecord): Promise<ReverificationOutcome> => {
  const transferExists = await isTransactionStillOnChain(payment.chainId, payment.matchedTxHash!);

  if (payment.status === 'reversed') {
    if (transferExists && (await transitionPaymentInTransaction(payment.id, 'reversed', 'confirmed'))) {
      return 'reconfirmed';
    }
    return 'intact';
  }

  if (transferExists) return 'intact';

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
