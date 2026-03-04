import type { Address } from 'viem';

export type { PremiumPlan } from './plans';
export type { PremiumSubscription } from './subscriptions';

export interface PaymentIntent {
  intentId: string;
  planId: string;
  chainId: number;
  token: {
    address: Address;
    symbol: 'USDC';
    decimals: number;
  };
  recipientAddress: Address;
  amountUsd: number;
  expiresAt: string;
}

export interface PaymentIntentStatus {
  intentId: string;
  status: 'pending' | 'confirmed' | 'expired' | 'failed';
  matchedTxHash: string | null;
}

export interface PlanSelectOption {
  value: string;
  label: string;
}
