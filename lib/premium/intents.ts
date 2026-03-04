import { and, count, eq } from 'drizzle-orm';
import { getDb } from 'lib/db/client';
import { premiumPaymentIntents } from 'lib/db/schema/premium';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { MINUTE } from 'lib/utils/time';
import type { Address } from 'viem';
import {
  getPaymentConfig,
  PREMIUM_INTENT_TTL_MINUTES,
  PREMIUM_MAX_PENDING_INTENTS_PER_USER,
  type PremiumPaymentChainId,
} from './payment-config';
import { getPremiumPlanById } from './plans';

interface CreatePaymentIntentParams {
  ownerAddress: Address;
  planId: string;
  chainId: number;
}

export type PremiumPaymentIntentRecord = typeof premiumPaymentIntents.$inferSelect;
export type PremiumPaymentIntentStatus = PremiumPaymentIntentRecord['status'];

export interface PaymentIntentStatusResponse {
  intentId: string;
  status: PremiumPaymentIntentStatus;
  matchedTxHash: string | null;
}

export const getPaymentIntentForOwner = async (
  intentId: string,
  ownerAddress: Address,
): Promise<PremiumPaymentIntentRecord | null> => {
  const db = getDb();
  const normalizedOwner = ownerAddress.toLowerCase();

  const intent = await db.query.premiumPaymentIntents.findFirst({
    where: and(eq(premiumPaymentIntents.id, intentId), eq(premiumPaymentIntents.ownerAddress, normalizedOwner)),
  });

  return intent ?? null;
};

export const toPaymentIntentStatusResponse = (intent: PremiumPaymentIntentRecord): PaymentIntentStatusResponse => ({
  intentId: intent.id,
  status: intent.status,
  matchedTxHash: intent.matchedTxHash,
});

export const createPaymentIntent = async ({ ownerAddress, planId, chainId }: CreatePaymentIntentParams) => {
  const plan = await getPremiumPlanById(planId);
  if (!plan) throw new Error('Unsupported premium plan');

  const paymentConfig = getPaymentConfig(chainId);
  if (!paymentConfig) throw new Error('Unsupported payment chain');

  const db = getDb();
  const normalizedOwner = ownerAddress.toLowerCase();

  const [{ count: pendingCount }] = await db
    .select({ count: count() })
    .from(premiumPaymentIntents)
    .where(and(eq(premiumPaymentIntents.ownerAddress, normalizedOwner), eq(premiumPaymentIntents.status, 'pending')));

  if (pendingCount >= PREMIUM_MAX_PENDING_INTENTS_PER_USER) {
    throw new Error('Too many pending payment intents. Please wait for existing ones to expire.');
  }

  const publicClient = createViemPublicClientForChain(chainId as PremiumPaymentChainId);
  const currentBlock = await publicClient.getBlockNumber();

  const expiresAt = new Date(Date.now() + PREMIUM_INTENT_TTL_MINUTES * MINUTE);

  const [insertedIntent] = await db
    .insert(premiumPaymentIntents)
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
      id: premiumPaymentIntents.id,
      chainId: premiumPaymentIntents.chainId,
      amountUsd: premiumPaymentIntents.amountUsd,
      expiresAt: premiumPaymentIntents.expiresAt,
    });

  return {
    intentId: insertedIntent.id,
    planId: plan.id,
    chainId: insertedIntent.chainId,
    token: paymentConfig.token,
    recipientAddress: paymentConfig.treasuryAddress,
    amountUsd: insertedIntent.amountUsd,
    expiresAt: insertedIntent.expiresAt.toISOString(),
  };
};
