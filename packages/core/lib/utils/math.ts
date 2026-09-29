import { formatUnits } from 'viem';

export const bigintMax = (...nums: bigint[]) => nums.reduce((a, b) => (a > b ? a : b));
export const bigintMin = (...nums: bigint[]) => nums.reduce((a, b) => (a < b ? a : b));

// The price is scaled to a fixed number of decimals (rather than the token's decimals), so that the value keeps its
// precision for tokens with few or no decimals, such as NFTs
const PRICE_DECIMALS = 18;
export const calculateFiatValue = (amount: bigint, price: number, decimals: number): number => {
  const scaledPrice = BigInt(Math.round(price * 10 ** PRICE_DECIMALS));
  return Number(formatUnits(amount * scaledPrice, decimals + PRICE_DECIMALS));
};
