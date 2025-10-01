import ky from 'ky';
import { apiLogin, isNullish } from 'lib/utils';
import { getChainPriceStrategy } from 'lib/utils/chains';
import { isErc721Contract, type TokenContract } from 'lib/utils/tokens';
import { formatUnits } from 'viem';
import type { PriceStrategy } from './PriceStrategy';

export const calculateTokenPrice = (inversePrice: bigint | null, tokenDecimals: number): number | null => {
  return isNullish(inversePrice) ? null : 1 / Number.parseFloat(formatUnits(inversePrice, tokenDecimals));
};

export const getNativeTokenPrice = async (chainId: number): Promise<number | null> => {
  await apiLogin();
  const response = await ky.get(`/api/${chainId}/native-price`).json<{ price: number | null }>();
  return response.price;
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
  if (isErc721Contract(tokenContract) && !strategy.supportedAssets.includes('ERC721')) return false;
  if (!isErc721Contract(tokenContract) && !strategy.supportedAssets.includes('ERC20')) return false;
  return true;
};
