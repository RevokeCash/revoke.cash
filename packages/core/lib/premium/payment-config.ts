import { ChainId } from '@revoke.cash/core/chains/ids';
import { type Address, getAddress, isAddressEqual } from 'viem';

export type PaymentTokenSymbol = 'USDC' | 'USDT';

export interface PaymentToken {
  symbol: PaymentTokenSymbol;
  address: Address;
  decimals: number;
}

export const PREMIUM_PAYMENT_TTL_MINUTES = 10;
export const PREMIUM_MAX_PENDING_PAYMENTS_PER_USER = 10;
export const PREMIUM_LATE_SETTLEMENT_HOURS = 48;

export const REFUND_WINDOW_DAYS = 17;
export const REFUND_DEADLINE_DAYS = 14;

export const PREMIUM_PAYMENT_CHAIN_IDS = [
  ChainId.Ethereum,
  ChainId.BNBChain,
  ChainId.Polygon,
  ChainId.Base,
  ChainId.Optimism,
  ChainId.Arbitrum,
  // ChainId.EthereumSepolia, --- DEVELOPMENT ONLY, NOT PRODUCTION
] as const;

export type PremiumPaymentChainId = (typeof PREMIUM_PAYMENT_CHAIN_IDS)[number];

const definePaymentToken = (symbol: PaymentTokenSymbol, tokenAddress: Address, decimals: number = 6): PaymentToken => ({
  symbol,
  address: getAddress(tokenAddress),
  decimals,
});

export const PAYMENT_TOKENS_BY_CHAIN_ID: Record<PremiumPaymentChainId, PaymentToken[]> = {
  [ChainId.Ethereum]: [
    definePaymentToken('USDC', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
    definePaymentToken('USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7'),
  ],
  [ChainId.BNBChain]: [
    definePaymentToken('USDC', '0x8AC76a51cc950d9822D68b83Fe1Ad97B32Cd580d', 18),
    definePaymentToken('USDT', '0x55d398326f99059fF775485246999027B3197955', 18),
  ],
  [ChainId.Polygon]: [
    definePaymentToken('USDC', '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
    definePaymentToken('USDT', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'),
  ],
  [ChainId.Base]: [
    definePaymentToken('USDC', '0x833589fCD6eDb6E08f4c7C32D4f71b54bDa02913'),
    definePaymentToken('USDT', '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'),
  ],
  [ChainId.Optimism]: [
    definePaymentToken('USDC', '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
    definePaymentToken('USDT', '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'),
  ],
  [ChainId.Arbitrum]: [
    definePaymentToken('USDC', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
    definePaymentToken('USDT', '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'),
  ],
  // [ChainId.EthereumSepolia]: [definePaymentToken('USDC', '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238')],
};

export const isSupportedPaymentChainId = (chainId: number): chainId is PremiumPaymentChainId => {
  return PREMIUM_PAYMENT_CHAIN_IDS.includes(chainId as PremiumPaymentChainId);
};

export const getPaymentTokens = (chainId: number): readonly PaymentToken[] => {
  if (!isSupportedPaymentChainId(chainId)) return [];
  return PAYMENT_TOKENS_BY_CHAIN_ID[chainId];
};

export const getPaymentToken = (chainId: number, tokenSymbol: PaymentTokenSymbol): PaymentToken | null => {
  return getPaymentTokens(chainId).find((paymentToken) => paymentToken.symbol === tokenSymbol) ?? null;
};

export const getPaymentTokenByAddress = (chainId: number, tokenAddress: Address): PaymentToken | null => {
  return getPaymentTokens(chainId).find((paymentToken) => isAddressEqual(paymentToken.address, tokenAddress)) ?? null;
};

export const usdCentsToTokenUnits = (amountUsdCents: number, tokenDecimals: number): bigint => {
  return BigInt(amountUsdCents) * 10n ** BigInt(tokenDecimals - 2);
};
