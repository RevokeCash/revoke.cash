import { formatFiatAmount, formatFixedPointBigInt } from '@revoke.cash/core/utils/formatting';

// Native token balances are always denominated in wei
const NATIVE_TOKEN_DECIMALS = 18;

// Six decimals keep small ETH amounts precise without drowning large POL or MON amounts in digits
export const formatNativeAmount = (amountWei: bigint, nativeToken: string): string => {
  return `${formatFixedPointBigInt(amountWei, NATIVE_TOKEN_DECIMALS, 0, 6)} ${nativeToken}`;
};

// formatFiatAmount only returns null for a missing amount
export const formatUsd = (amountUsd: number): string => formatFiatAmount(amountUsd)!;

export const formatPercentage = (fraction: number): string => `${Math.round(fraction * 100)}%`;
