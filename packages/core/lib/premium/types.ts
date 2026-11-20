import type { Address } from 'viem';
import type { PaymentToken } from './payment-config';

export type { PremiumEntitlement } from './entitlements';
export type { PaymentToken, PaymentTokenSymbol } from './payment-config';
export type { PaymentStatusResponse as PaymentStatus } from './payments';
export type { PremiumPlan } from './plans';
export type { PremiumSubscription, SubscriptionPayment } from './subscriptions';

export interface PendingPayment {
  paymentId: string;
  planId: string;
  chainId: number;
  token: PaymentToken;
  recipientAddress: Address;
  amountUsdCents: number;
}
