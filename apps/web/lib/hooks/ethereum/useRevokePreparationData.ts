import { getAllowanceKey, simulateRevokeAllowance, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isNullish } from '@revoke.cash/core/utils';
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

type AllowanceWithPayload = TokenAllowanceData & { payload: NonNullable<TokenAllowanceData['payload']> };
type RevokePreparation = Pick<AllowanceWithPayload['payload'], 'preparedRevoke' | 'revokeError'>;
type RevokePreparationByAllowance = Record<string, RevokePreparation | undefined>;

export const useRevokePreparationData = (
  queries: ChainAllowanceRevokePreparationQuery[],
): RevokePreparationByAllowance => {
  const config = useConfig();

  return useQueries({
    queries: queries.map(({ chainId, allowances }) => {
      const allowancesToPrepare = allowances.filter(hasPayload);

      return {
        queryKey: ['revokePreparation', chainId, allowancesToPrepare.map(getAllowanceKey).sort()],
        queryFn: () => fetchRevokePreparationData(allowancesToPrepare, getPublicClient(config, { chainId })!),
        staleTime: MINUTE,
        refetchOnWindowFocus: false,
        placeholderData: undefined,
        enabled: allowancesToPrepare.length > 0,
      };
    }),
    combine: (results) => {
      const data: RevokePreparationByAllowance = {};

      queries.forEach(({ allowances }, index) => {
        const queryData = results[index]?.data;

        for (const allowance of allowances) {
          if (!hasPayload(allowance)) continue;
          const allowanceKey = getAllowanceKey(allowance);
          data[allowanceKey] = queryData?.[allowanceKey];
        }
      });

      return data;
    },
  });
};

const fetchRevokePreparationData = async (
  allowances: AllowanceWithPayload[],
  publicClient: PublicClient,
): Promise<RevokePreparationByAllowance> => {
  const preparedAllowances = await mapAsyncBounded(allowances, 25, (allowance) =>
    simulateRevokeAllowance(allowance, publicClient),
  );

  return Object.fromEntries(
    preparedAllowances.filter(hasPayload).map((allowance) => [
      getAllowanceKey(allowance),
      {
        preparedRevoke: allowance.payload.preparedRevoke,
        revokeError: allowance.payload.revokeError,
      },
    ]),
  );
};

const hasPayload = (allowance: TokenAllowanceData): allowance is AllowanceWithPayload => {
  return !isNullish(allowance.payload);
};
