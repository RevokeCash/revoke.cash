import { getAllowanceKey, simulateRevokeAllowance, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQueries } from '@tanstack/react-query';
import type { PublicClient } from 'viem';
import { useConfig } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';

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
  const preparedAllowances = await mapAsyncBounded(allowances, 25, (allowance) =>
    simulateRevokeAllowance(allowance, publicClient),
  );

  return Object.fromEntries(
    preparedAllowances.map((allowance) => [
      getAllowanceKey(allowance),
      {
        preparedRevoke: allowance.payload.preparedRevoke,
        revokeError: allowance.payload.revokeError,
      },
    ]),
  );
};
