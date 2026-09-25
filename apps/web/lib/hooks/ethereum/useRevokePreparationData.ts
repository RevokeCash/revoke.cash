import {
  getAllowanceKey,
  isErc20Allowance,
  simulateRevokeAllowance,
  type TokenAllowanceData,
} from '@revoke.cash/core/allowances';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQueries } from '@tanstack/react-query';
import type { PublicClient } from 'viem';
import { useConfig } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import { queryClient } from '../QueryProvider';

interface ChainAllowanceRevokePreparationQuery {
  chainId: number;
  allowances: TokenAllowanceData[];
}

type RevokePreparation = Pick<TokenAllowanceData['payload'], 'preparedRevoke' | 'revokeError'>;
type RevokePreparationByAllowance = Record<string, RevokePreparation | undefined>;

export const useRevokePreparationData = (
  queries: ChainAllowanceRevokePreparationQuery[],
): RevokePreparationByAllowance => {
  const config = useConfig();

  return useQueries({
    queries: queries.map(({ chainId, allowances }) => {
      return {
        queryKey: ['revokePreparation', chainId, allowances.map(getAllowanceKey).sort()],
        queryFn: () => fetchRevokePreparationData(allowances, getPublicClient(config, { chainId })!),
        staleTime: MINUTE,
        refetchOnWindowFocus: false,
        placeholderData: undefined,
        enabled: allowances.length > 0,
      };
    }),
    combine: (results) => {
      const data: RevokePreparationByAllowance = {};

      queries.forEach(({ allowances }, index) => {
        const queryData = results[index]?.data;

        for (const allowance of allowances) {
          const allowanceKey = getAllowanceKey(allowance);
          data[allowanceKey] = queryData?.[allowanceKey];
        }
      });

      return data;
    },
  });
};

const fetchRevokePreparationData = async (
  allowances: TokenAllowanceData[],
  publicClient: PublicClient,
): Promise<RevokePreparationByAllowance> => {
  // Every revoke removes an allowance from the list (and so changes the query key above), so we cache each allowance's
  // preparation separately to avoid simulating all remaining allowances again after every revoke
  const preparations = await mapAsyncBounded(allowances, 25, (allowance) =>
    queryClient.query({
      queryKey: getAllowanceRevokePreparationQueryKey(allowance),
      queryFn: () => fetchAllowanceRevokePreparation(allowance, publicClient),
      // Failed simulations can be caused by transient RPC errors, so those are simulated again on the next fetch
      staleTime: (query) => (query.state.data?.revokeError ? 0 : Number.POSITIVE_INFINITY),
    }),
  );

  return Object.fromEntries(allowances.map((allowance, index) => [getAllowanceKey(allowance), preparations[index]]));
};

const fetchAllowanceRevokePreparation = async (
  allowance: TokenAllowanceData,
  publicClient: PublicClient,
): Promise<RevokePreparation> => {
  const { payload } = await simulateRevokeAllowance(allowance, publicClient);
  return { preparedRevoke: payload.preparedRevoke, revokeError: payload.revokeError };
};

const getAllowanceRevokePreparationQueryKey = (allowance: TokenAllowanceData) => {
  // Some tokens can only be revoked with decreaseAllowance(spender, amount), so the preparation depends on the amount
  const amount = isErc20Allowance(allowance.payload) ? allowance.payload.amount.toString() : null;
  return ['allowanceRevokePreparation', getAllowanceKey(allowance), amount];
};
