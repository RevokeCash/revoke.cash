import { and, count, eq, gt } from 'drizzle-orm';
import { getDb } from 'lib/db/client';
import { premiumPayments, premiumSubscriptions } from 'lib/db/schema/premium';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { MINUTE } from 'lib/utils/time';
import type { Address } from 'viem';
import {
  getPaymentConfig,
  PREMIUM_MAX_PENDING_PAYMENTS_PER_USER,
  PREMIUM_PAYMENT_TTL_MINUTES,
  type PremiumPaymentChainId,
} from './payment-config';
import { getPremiumPlanById } from './plans';

interface CreatePaymentParams {
  ownerAddress: Address;
  planId: string;
  chainId: number;
}

export type PremiumPaymentRecord = typeof premiumPayments.$inferSelect;
export type PremiumPaymentStatus = PremiumPaymentRecord['status'];

export interface PaymentStatusResponse {
  paymentId: string;
  status: PremiumPaymentStatus;
  matchedTxHash: string | null;
}

export const getPaymentForOwner = async (
  paymentId: string,
  ownerAddress: Address,
): Promise<PremiumPaymentRecord | null> => {
  const db = getDb();
  const normalizedOwner = ownerAddress.toLowerCase();

  const payment = await db.query.premiumPayments.findFirst({
    where: and(eq(premiumPayments.id, paymentId), eq(premiumPayments.ownerAddress, normalizedOwner)),
  });

  return payment ?? null;
};

export const toPaymentStatusResponse = (payment: PremiumPaymentRecord): PaymentStatusResponse => ({
  paymentId: payment.id,
  status: payment.status,
  matchedTxHash: payment.matchedTxHash,
});

export const createPayment = async ({ ownerAddress, planId, chainId }: CreatePaymentParams) => {
  const plan = await getPremiumPlanById(planId);
  if (!plan) throw new Error('Unsupported premium plan');

  const paymentConfig = getPaymentConfig(chainId);
  if (!paymentConfig) throw new Error('Unsupported payment chain');

  const db = getDb();
  const normalizedOwner = ownerAddress.toLowerCase();

  // Prevent downgrade: if the user has an active subscription on a more expensive plan,
  // they must renew at the same tier or upgrade
  const activeSubscription = await db.query.premiumSubscriptions.findFirst({
    where: and(eq(premiumSubscriptions.ownerAddress, normalizedOwner), gt(premiumSubscriptions.endsAt, new Date())),
    columns: { planId: true },
    with: { plan: { columns: { priceUsd: true } } },
  });

  if (activeSubscription && plan.priceUsd < activeSubscription.plan.priceUsd) {
    throw new Error('Cannot renew with a lower-tier plan. Please select the same plan or upgrade.');
  }

  const [{ count: pendingCount }] = await db
    .select({ count: count() })
    .from(premiumPayments)
    .where(and(eq(premiumPayments.ownerAddress, normalizedOwner), eq(premiumPayments.status, 'pending')));

  if (pendingCount >= PREMIUM_MAX_PENDING_PAYMENTS_PER_USER) {
    throw new Error('Too many pending payments. Please wait for existing ones to expire.');
  }

  const publicClient = createViemPublicClientForChain(chainId as PremiumPaymentChainId);
  const currentBlock = await publicClient.getBlockNumber();

  const expiresAt = new Date(Date.now() + PREMIUM_PAYMENT_TTL_MINUTES * MINUTE);

  const [insertedPayment] = await db
    .insert(premiumPayments)
    .values({
      planId: plan.id,
      planVersion: plan.version,
      ownerAddress: normalizedOwner,
      chainId,
      tokenAddress: paymentConfig.token.address,
      tokenSymbol: paymentConfig.token.symbol,
      tokenDecimals: paymentConfig.token.decimals,
      amountUsd: plan.priceUsd,
      status: 'pending',
      expiresAt,
      scanFromBlock: currentBlock,
    })
    .returning({
      id: premiumPayments.id,
      chainId: premiumPayments.chainId,
      amountUsd: premiumPayments.amountUsd,
      expiresAt: premiumPayments.expiresAt,
    });

  return {
    paymentId: insertedPayment.id,
    planId: plan.id,
    chainId: insertedPayment.chainId,
    token: paymentConfig.token,
    recipientAddress: paymentConfig.treasuryAddress,
    amountUsd: insertedPayment.amountUsd,
    expiresAt: insertedPayment.expiresAt.toISOString(),
  };
};
