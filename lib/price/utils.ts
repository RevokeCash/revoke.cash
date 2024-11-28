import { isNullish } from 'lib/utils';
import { getChainPriceStrategy } from 'lib/utils/chains';
import { isErc721Contract, type TokenContract } from 'lib/utils/tokens';
import { formatUnits, type PublicClient } from 'viem';
import type { PriceStrategy } from './PriceStrategy';

export const calculateTokenPrice = (inversePrice: bigint | null, tokenDecimals: number): number | undefined => {
  return isNullish(inversePrice) ? undefined : 1 / Number.parseFloat(formatUnits(inversePrice, tokenDecimals));
};

export const getNativeTokenPrice = async (chainId: number, publicClient: PublicClient): Promise<number | undefined> => {
  const strategy = getChainPriceStrategy(chainId);

  if (!strategy) return undefined;

  try {
    return await strategy.calculateNativeTokenPrice(publicClient);
  } catch {
    return undefined;
  }
};

export const getTokenPrice = async (chainId: number, tokenContract: TokenContract): Promise<number | undefined> => {
  const strategy = getChainPriceStrategy(chainId);
  if (!strategy || !strategySupportsToken(strategy, tokenContract)) return undefined;

  try {
    return await strategy.calculateTokenPrice(tokenContract);
  } catch {
    return undefined;
  }
};

export const strategySupportsToken = (strategy: PriceStrategy, tokenContract: TokenContract): boolean => {
  if (isErc721Contract(tokenContract) && !strategy.supportedAssets.includes('ERC721')) return false;
  if (!isErc721Contract(tokenContract) && !strategy.supportedAssets.includes('ERC20')) return false;
  return true;
};
