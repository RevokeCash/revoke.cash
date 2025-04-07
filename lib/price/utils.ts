import { isNullish } from 'lib/utils';
import { getChainPriceStrategy } from 'lib/utils/chains';
import type { TokenContract } from 'lib/utils/tokens';
import { type PublicClient, formatUnits } from 'viem';
import type { PriceStrategy } from './PriceStrategy';

export const calculateTokenPrice = (inversePrice: bigint | null, tokenDecimals: number): number | null => {
  return isNullish(inversePrice) ? null : 1 / Number.parseFloat(formatUnits(inversePrice, tokenDecimals));
};

export const getNativeTokenPrice = async (chainId: number, publicClient: PublicClient): Promise<number | null> => {
  const strategy = getChainPriceStrategy(chainId);

  if (!strategy) return null;

  try {
    return await strategy.calculateNativeTokenPrice(publicClient);
  } catch {
    return null;
  }
};

export const getTokenPrice = async (chainId: number, tokenContract: TokenContract): Promise<number | null> => {
  const strategy = getChainPriceStrategy(chainId);
  if (!strategy || !strategySupportsToken(strategy, tokenContract)) return null;

  try {
    return await strategy.calculateTokenPrice(tokenContract);
  } catch {
    return null;
  }
};

export const strategySupportsToken = (strategy: PriceStrategy, tokenContract: TokenContract): boolean => {
  return strategy.supportedAssets.includes(tokenContract.tokenStandard);
};
