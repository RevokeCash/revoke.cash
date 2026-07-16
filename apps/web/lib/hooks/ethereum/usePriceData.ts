import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQueries } from '@tanstack/react-query';
import { getTokenPrices } from 'lib/price';
import type { Address } from 'viem';
import type { ChainTokenQuery } from './useBalanceData';

export const getPriceKey = (chainId: number, tokenAddress: Address) => `${chainId}-${tokenAddress}`;

export const usePriceData = (queries: ChainTokenQuery[]): Record<string, number | null> => {
  return useQueries({
    queries: queries.map(({ chainId, tokens, blockNumber }) => {
      const addresses = blockNumber === undefined ? getErc20Addresses(tokens) : [];
      return {
        queryKey: ['tokenPrices', chainId, addresses],
        queryFn: () => getTokenPrices(chainId, addresses),
        staleTime: 5 * MINUTE,
        refetchOnWindowFocus: false,
        placeholderData: undefined,
        enabled: addresses.length > 0,
      };
    }),
    combine: (results) => {
      const map: Record<string, number | null> = {};
      queries.forEach(({ chainId, tokens, blockNumber }, index) => {
        const addresses = blockNumber === undefined ? getErc20Addresses(tokens) : [];
        const queryData = results[index]?.data;
        for (const tokenAddress of addresses) {
          map[getPriceKey(chainId, tokenAddress)] = queryData?.[tokenAddress] ?? null;
        }
      });
      return map;
    },
  });
};

const getErc20Addresses = (tokens: ChainTokenQuery['tokens']): Address[] => {
  return tokens
    .filter((token) => !token.isErc721)
    .map((token) => token.address)
    .sort();
};
