import { TokenContract } from 'lib/interfaces';
import { getChainPriceStrategy } from 'lib/utils/chains';
import { isErc721Contract } from 'lib/utils/tokens';
import { PublicClient, formatUnits } from 'viem';

export const calculateTokenPrice = (inversePrice: bigint | null, tokenDecimals: number): number => {
  return inversePrice !== null ? 1 / Number.parseFloat(formatUnits(inversePrice, tokenDecimals)) : null;
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

export const getInverseTokenPrice = async (chainId: number, tokenContract: TokenContract): Promise<bigint | null> => {
  if (isErc721Contract(tokenContract)) return null;

  const strategy = getChainPriceStrategy(chainId);
  if (!strategy) return null;

  try {
    return await strategy.calculateInversePrice(tokenContract);
  } catch {
    return null;
  }
};
