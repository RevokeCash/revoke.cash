import { useQueries } from '@tanstack/react-query';
import { getTokenPrices } from 'lib/price/utils';
import { MINUTE } from 'lib/utils/time';
import type { Address } from 'viem';

export interface ChainTokenAddresses {
  chainId: number;
  addresses: Address[];
}

export const getPriceKey = (chainId: number, tokenAddress: Address) => `${chainId}-${tokenAddress}`;

export const usePriceData = (tokenAddressesByChain: ChainTokenAddresses[]): Record<string, number | null> => {
  return useQueries({
    queries: tokenAddressesByChain.map(({ chainId, addresses }) => ({
      queryKey: ['tokenPrices', chainId, addresses],
      queryFn: () => getTokenPrices(chainId, addresses),
      staleTime: 5 * MINUTE,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
      enabled: addresses.length > 0,
    })),
    combine: (results) => {
      const map: Record<string, number | null> = {};
      tokenAddressesByChain.forEach(({ chainId, addresses }, index) => {
        const queryData = results[index]?.data;
        for (const tokenAddress of addresses) {
          map[getPriceKey(chainId, tokenAddress)] = queryData?.[tokenAddress] ?? null;
        }
      });
      return map;
    },
  });
};
