import { TokenContract } from 'lib/interfaces';
import { isNullish } from 'lib/utils';
import { getChainPriceStrategy } from 'lib/utils/chains';
import { isErc721Contract } from 'lib/utils/tokens';
import { PublicClient, formatUnits } from 'viem';
import { PriceStrategy } from './PriceStrategy';

export const calculateTokenPrice = (inversePrice: bigint | null, tokenDecimals: number): number => {
  return !isNullish(inversePrice) ? 1 / Number.parseFloat(formatUnits(inversePrice, tokenDecimals)) : null;
};

export const getNativeTokenPrice = async (chainId: number, publicClient: PublicClient): Promise<number | null> => {
  const strategy = getChainPriceStrategy(chainId);

  try {
    return await strategy.calculateNativeTokenPrice(publicClient);
  } catch {
    return null;
  }
};

export const getInverseTokenPrice = async (chainId: number, tokenContract: TokenContract): Promise<bigint | null> => {
  const strategy = getChainPriceStrategy(chainId);
  if (!strategy || !strategySupportsToken(strategy, tokenContract)) return null;

  try {
    return await strategy.calculateInversePrice(tokenContract);
  } catch {
    return null;
  }
};

export const strategySupportsToken = (strategy: PriceStrategy, tokenContract: TokenContract): boolean => {
  if (isErc721Contract(tokenContract) && !strategy.supportedAssets.includes('ERC721')) return false;
  if (!isErc721Contract(tokenContract) && !strategy.supportedAssets.includes('ERC20')) return false;
  return true;
};
