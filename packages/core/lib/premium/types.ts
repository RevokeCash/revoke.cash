import type { Address } from 'viem';

export type { PremiumEntitlement } from './entitlements';
export type { PaymentStatusResponse as PaymentStatus } from './payments';
export type { PremiumPlan } from './plans';
export type { PremiumSubscription, SubscriptionPayment } from './subscriptions';

export interface PendingPayment {
  paymentId: string;
  planId: string;
  chainId: number;
  token: {
    address: Address;
    symbol: 'USDC';
    decimals: number;
  };
  recipientAddress: Address;
  amountUsdCents: number;
  expiresAt: string;
}
