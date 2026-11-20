import { getDb } from '@revoke.cash/core/db/client';
import { premiumPayments, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { ExportableError } from '@revoke.cash/core/utils/errors';
import { HOUR } from '@revoke.cash/core/utils/time';
import { and, eq, gt, sql } from 'drizzle-orm';
import type { Address } from 'viem';
import { SUBSCRIPTIONS_ADDRESS } from '../constants';
import { getPaymentToken, type PaymentTokenSymbol, PREMIUM_PAYMENT_WINDOW_HOURS } from './payment-config';
import { getPremiumPlanById } from './plans';

interface CreatePaymentParams {
  ownerAddress: Address;
  planId: string;
  chainId: number;
  tokenSymbol: PaymentTokenSymbol;
  vatRegion: string | null;
}

export type PremiumPaymentRecord = typeof premiumPayments.$inferSelect;
export type PremiumPaymentStatus = PremiumPaymentRecord['status'];

export class PremiumPaymentError extends ExportableError {
  constructor(message: string) {
    super(message);
    this.name = 'PremiumPaymentError';
  }

  export() {
    return { status: 400, body: { message: this.message } };
  }
}

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

  const payment = await db.query.premiumPayments.findFirst({
    where: and(eq(premiumPayments.id, paymentId), eq(premiumPayments.ownerAddress, ownerAddress)),
  });

  return payment ?? null;
};

export const toPaymentStatusResponse = (payment: PremiumPaymentRecord): PaymentStatusResponse => ({
  paymentId: payment.id,
  status: payment.status,
  matchedTxHash: payment.matchedTxHash,
});

export const createPayment = async ({ ownerAddress, planId, chainId, tokenSymbol, vatRegion }: CreatePaymentParams) => {
  const plan = await getPremiumPlanById(planId);
  if (!plan) throw new PremiumPaymentError('Unsupported premium plan');

  const paymentToken = getPaymentToken(chainId, tokenSymbol);
  if (!paymentToken) throw new PremiumPaymentError(`Unsupported payment token for this chain: ${tokenSymbol}`);

  const db = getDb();

  // Prevent downgrade: if the user has an active subscription on a more expensive plan,
  // they must renew at the same tier or upgrade
  const activeSubscription = await db.query.premiumSubscriptions.findFirst({
    where: and(eq(premiumSubscriptions.ownerAddress, ownerAddress), gt(premiumSubscriptions.endsAt, new Date())),
    columns: { planId: true },
    with: { plan: { columns: { priceUsdCents: true } } },
  });

  if (activeSubscription && plan.priceUsdCents < activeSubscription.plan.priceUsdCents) {
    throw new PremiumPaymentError('Cannot renew with a lower-tier plan. Please select the same plan or upgrade.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + PREMIUM_PAYMENT_WINDOW_HOURS * HOUR);

  // An incoming transfer confirms the pending payment with the same owner, chain, token and amount. At most one such
  // payment can be pending (partial unique index), so a repeated checkout renews the pending payment that exists.
  const [payment] = await db
    .insert(premiumPayments)
    .values({
      planId: plan.id,
      planVersion: plan.version,
      ownerAddress,
      chainId,
      tokenAddress: paymentToken.address,
      tokenSymbol: paymentToken.symbol,
      tokenDecimals: paymentToken.decimals,
      amountUsdCents: plan.priceUsdCents,
      status: 'pending',
      expiresAt,
      vatRegion,
    })
    .onConflictDoUpdate({
      target: [
        premiumPayments.ownerAddress,
        premiumPayments.chainId,
        premiumPayments.tokenAddress,
        premiumPayments.amountUsdCents,
      ],
      targetWhere: sql`${premiumPayments.status} = 'pending'`,
      set: { planId: plan.id, planVersion: plan.version, vatRegion, expiresAt, createdAt: now },
    })
    .returning({
      id: premiumPayments.id,
      chainId: premiumPayments.chainId,
      amountUsdCents: premiumPayments.amountUsdCents,
    });

  return {
    paymentId: payment.id,
    planId: plan.id,
    chainId: payment.chainId,
    token: paymentToken,
    recipientAddress: SUBSCRIPTIONS_ADDRESS,
    amountUsdCents: payment.amountUsdCents,
  };
};
