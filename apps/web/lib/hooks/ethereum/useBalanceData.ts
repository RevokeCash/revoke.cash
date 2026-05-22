import { ERC20_ABI } from '@revoke.cash/core/abis';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import type { TokenBalance } from '@revoke.cash/core/tokens';
import { withFallback } from '@revoke.cash/core/utils/promises';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQueries } from '@tanstack/react-query';
import type { Address } from 'viem';

export interface ChainTokenQuery {
  chainId: number;
  owner: Address;
  tokens: Array<{ address: Address; isErc721: boolean }>;
  blockNumber?: bigint;
}

export const getBalanceKey = (chainId: number, tokenAddress: Address) => `${chainId}-${tokenAddress}`;

export const useBalanceData = (queries: ChainTokenQuery[]): Record<string, TokenBalance | undefined> => {
  return useQueries({
    queries: queries.map(({ chainId, owner, tokens, blockNumber }) => ({
      queryKey: ['tokenBalances', chainId, owner, tokens.map((t) => t.address).sort(), blockNumber?.toString() ?? null],
      queryFn: () => fetchBalancesForChain(chainId, owner, tokens, blockNumber),
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

const fetchBalancesForChain = async (
  chainId: number,
  owner: Address,
  tokens: Array<{ address: Address; isErc721: boolean }>,
  blockNumber: bigint | undefined,
): Promise<Record<Address, TokenBalance>> => {
  const publicClient = createViemPublicClientForChain(chainId);

  const entries = await Promise.all(
    tokens.map(async ({ address, isErc721 }): Promise<[Address, TokenBalance]> => {
      // We don't display balances for ERC721s
      if (isErc721) return [address, 'Unknown'];

      const balance = await withFallback<TokenBalance>(
        publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'balanceOf', args: [owner], blockNumber }),
        'Unknown',
      );
      return [address, balance];
    }),
  );

  return Object.fromEntries(entries);
};
