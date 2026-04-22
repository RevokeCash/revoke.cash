import { ChainId } from '@revoke.cash/chains';
import { SUBSCRIPTIONS_ADDRESS } from '@revoke.cash/core/constants';
import { type Address, getAddress } from 'viem';

export interface PaymentConfig {
  token: {
    symbol: 'USDC';
    address: Address;
    decimals: 6;
  };
  paymentAddress: Address;
}

export const PREMIUM_PAYMENT_TTL_MINUTES = 10;
export const PREMIUM_MAX_PENDING_PAYMENTS_PER_USER = 10;

export const PREMIUM_PAYMENT_CHAIN_IDS = [
  ChainId.EthereumMainnet,
  ChainId.BNBSmartChainMainnet,
  ChainId.PolygonMainnet,
  ChainId.Base,
  ChainId.OPMainnet,
  ChainId.ArbitrumOne,
  ChainId.EthereumSepolia,
] as const;

export type PremiumPaymentChainId = (typeof PREMIUM_PAYMENT_CHAIN_IDS)[number];

const withUsdc = (tokenAddress: Address): PaymentConfig => ({
  token: {
    symbol: 'USDC',
    address: getAddress(tokenAddress),
    decimals: 6,
  },
  paymentAddress: SUBSCRIPTIONS_ADDRESS,
});

export const PAYMENT_CONFIG_BY_CHAIN_ID: Record<PremiumPaymentChainId, PaymentConfig> = {
  [ChainId.EthereumMainnet]: withUsdc('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  [ChainId.BNBSmartChainMainnet]: withUsdc('0x8AC76a51cc950d9822D68b83Fe1Ad97B32Cd580d'),
  [ChainId.PolygonMainnet]: withUsdc('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
  [ChainId.Base]: withUsdc('0x833589fCD6eDb6E08f4c7C32D4f71b54bDa02913'),
  [ChainId.OPMainnet]: withUsdc('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
  [ChainId.ArbitrumOne]: withUsdc('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
  [ChainId.EthereumSepolia]: withUsdc('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
};

export const isSupportedPaymentChainId = (chainId: number): chainId is PremiumPaymentChainId => {
  return PREMIUM_PAYMENT_CHAIN_IDS.includes(chainId as PremiumPaymentChainId);
};

export const getPaymentConfig = (chainId: number): PaymentConfig | null => {
  if (!isSupportedPaymentChainId(chainId)) return null;
  return PAYMENT_CONFIG_BY_CHAIN_ID[chainId];
};
