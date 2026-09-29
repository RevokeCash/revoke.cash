import { getTokenBalances, type TokenBalance } from '@revoke.cash/core/tokens';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQueries } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useConfig } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';

export interface ChainTokenQuery {
  chainId: number;
  owner: Address;
  tokens: Array<{ address: Address; isErc721: boolean }>;
  blockNumber?: bigint;
}

export const getBalanceKey = (chainId: number, tokenAddress: Address) => `${chainId}-${tokenAddress}`;

export const useBalanceData = (queries: ChainTokenQuery[]): Record<string, TokenBalance | undefined> => {
  const config = useConfig();

  return useQueries({
    queries: queries.map(({ chainId, owner, tokens, blockNumber }) => ({
      queryKey: ['tokenBalances', chainId, owner, tokens.map((t) => t.address).sort(), blockNumber?.toString() ?? null],
      queryFn: () =>
        getTokenBalances(
          getPublicClient(config, { chainId })!,
          owner,
          tokens.map((token) => token.address),
          blockNumber,
        ),
      staleTime: MINUTE,
      refetchOnWindowFocus: false,
      placeholderData: undefined,
      enabled: tokens.length > 0,
    })),
    combine: (results) => {
      const map: Record<string, TokenBalance | undefined> = {};
      queries.forEach(({ chainId, tokens }, index) => {
        const queryData = results[index]?.data;
        for (const { address } of tokens) {
          map[getBalanceKey(chainId, address)] = queryData?.[address];
        }
      });
      return map;
    },
  });
};
