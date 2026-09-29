import { getChainCoingeckoAssetPlatformId } from '@revoke.cash/core/chains';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQueries } from '@tanstack/react-query';
import { getNftFloorPrices, getTokenPrices } from 'lib/price';
import type { Address } from 'viem';
import type { ChainTokenQuery } from './useBalanceData';

interface PriceQuery {
  type: keyof typeof PRICE_FETCHERS;
  chainId: number;
  addresses: Address[];
}

const PRICE_FETCHERS = {
  tokenPrices: getTokenPrices,
  nftFloorPrices: getNftFloorPrices,
};

export const getPriceKey = (chainId: number, tokenAddress: Address) => `${chainId}-${tokenAddress}`;

export const usePriceData = (queries: ChainTokenQuery[]): Record<string, number | null> => {
  const priceQueries = queries.flatMap(getPriceQueries);

  return useQueries({
    queries: priceQueries.map(({ type, chainId, addresses }) => ({
      queryKey: [type, chainId, addresses],
      queryFn: () => PRICE_FETCHERS[type](chainId, addresses),
      staleTime: 5 * MINUTE,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
      enabled: addresses.length > 0,
    })),
    combine: (results) => {
      const map: Record<string, number | null> = {};
      priceQueries.forEach(({ chainId, addresses }, index) => {
        const queryData = results[index]?.data;
        for (const tokenAddress of addresses) {
          map[getPriceKey(chainId, tokenAddress)] = queryData?.[tokenAddress] ?? null;
        }
      });
      return map;
    },
  });
};

const getPriceQueries = ({ chainId, tokens, blockNumber }: ChainTokenQuery): PriceQuery[] => {
  // Historical allowances are displayed without prices
  if (blockNumber !== undefined) return [];

  // NFT floor prices are only available on chains where CoinGecko tracks NFT collections
  const hasNftFloorPrices = Boolean(getChainCoingeckoAssetPlatformId(chainId));

  return [
    { type: 'tokenPrices', chainId, addresses: getErc20Addresses(tokens) },
    { type: 'nftFloorPrices', chainId, addresses: hasNftFloorPrices ? getErc721Addresses(tokens) : [] },
  ];
};

const getErc20Addresses = (tokens: ChainTokenQuery['tokens']): Address[] => {
  return tokens
    .filter((token) => !token.isErc721)
    .map((token) => token.address)
    .sort();
};

const getErc721Addresses = (tokens: ChainTokenQuery['tokens']): Address[] => {
  return tokens
    .filter((token) => token.isErc721)
    .map((token) => token.address)
    .sort();
};
