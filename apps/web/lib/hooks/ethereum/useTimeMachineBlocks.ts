import { findBlockByTimestamp } from '@revoke.cash/core/blocks';
import { createViemPublicClientForChain, ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { isNullish } from '@revoke.cash/core/utils';
import { useQueries } from '@tanstack/react-query';

/**
 * Resolves the closest block at or before a target timestamp for all chains in parallel.
 * Returns a Record mapping chainId to:
 *   - `number` — resolved block number
 *   - `null` — chain did not exist at the target timestamp
 *   - `undefined` — still loading or query disabled
 *
 * Chains are skipped if they have no events (nonce-based optimization: no events means no
 * on-chain activity for this address, so no block lookup is needed).
 */
export const useTimeMachineBlocks = (
  targetTimestamp: number | undefined,
  activeChainIds: number[],
): Record<number, number | null | undefined> => {
  return useQueries({
    queries: ORDERED_CHAINS.map((chainId) => ({
      queryKey: ['blockAtTimestamp', chainId, targetTimestamp],
      queryFn: async () => {
        const publicClient = createViemPublicClientForChain(chainId);
        const result = await findBlockByTimestamp(publicClient, targetTimestamp!);
        return result?.blockNumber ?? null;
      },
      enabled: !isNullish(targetTimestamp) && activeChainIds.includes(chainId),
      staleTime: Number.POSITIVE_INFINITY,
    })),
    combine: (results) => {
      const map: Record<number, number | null | undefined> = {};
      ORDERED_CHAINS.forEach((chainId, index) => {
        // Keep null (chain didn't exist) distinct from undefined (still loading)
        map[chainId] = results[index]?.data;
      });
      return map;
    },
  });
};
