import { getAllowanceKey, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isErc721 } from '@revoke.cash/core/tokens';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { useMemo } from 'react';
import type { Address } from 'viem';
import { useAllowanceSpenderData } from './useAllowanceSpenderData';
import { type ChainTokenQuery, getBalanceKey, useBalanceData } from './useBalanceData';
import { getPriceKey, usePriceData } from './usePriceData';
import { useRevokePreparationData } from './useRevokePreparationData';
import { getSpenderKey } from './useSpenderData';

export interface ChainAllowancesToEnrich {
  chainId: number;
  allowances: TokenAllowanceData[];
  blockNumber?: bigint;
}

interface UseEnrichAllowancesParameters {
  owner: Address;
  chainAllowances: ChainAllowancesToEnrich[];
  isHistorical?: boolean;
}

export const useEnrichAllowances = ({
  owner,
  chainAllowances,
  isHistorical = false,
}: UseEnrichAllowancesParameters): TokenAllowanceData[][] => {
  const tokenDataQueries = useMemo<ChainTokenQuery[]>(() => {
    return chainAllowances.map(({ chainId, allowances, blockNumber }) => {
      const allTokens = allowances.map((allowance) => ({
        address: allowance.token.address,
        isErc721: isErc721(allowance.token),
      }));

      const tokens = deduplicateArray(allTokens, (token) => token.address).sort((a, b) =>
        a.address.localeCompare(b.address),
      );

      return { chainId, owner, tokens, blockNumber };
    });
  }, [chainAllowances, owner]);

  const allAllowances = useMemo(() => {
    return chainAllowances.flatMap(({ allowances }) => allowances);
  }, [chainAllowances]);

  const priceData = usePriceData(tokenDataQueries);
  const balanceData = useBalanceData(tokenDataQueries);
  const spenderData = useAllowanceSpenderData(allAllowances);
  const revokePreparationData = useRevokePreparationData(
    isHistorical
      ? []
      : chainAllowances.map(({ chainId, allowances }) => ({
          chainId,
          allowances,
        })),
  );

  return useMemo(() => {
    return chainAllowances.map(({ allowances }) =>
      enrichAllowances(allowances, {
        isHistorical,
        priceData,
        balanceData,
        spenderData,
        revokePreparationData,
      }),
    );
  }, [chainAllowances, isHistorical, priceData, balanceData, spenderData, revokePreparationData]);
};

interface AllowanceEnrichmentData {
  isHistorical?: boolean;
  priceData: ReturnType<typeof usePriceData>;
  balanceData: ReturnType<typeof useBalanceData>;
  spenderData: ReturnType<typeof useAllowanceSpenderData>;
  revokePreparationData: ReturnType<typeof useRevokePreparationData>;
}

type AllowanceWithPayload = TokenAllowanceData & { payload: NonNullable<TokenAllowanceData['payload']> };

export const enrichAllowances = (
  allowances: TokenAllowanceData[],
  { isHistorical = false, priceData, balanceData, spenderData, revokePreparationData }: AllowanceEnrichmentData,
): TokenAllowanceData[] => {
  return allowances.filter(hasPayload).map((allowance) => {
    const priceKey = getPriceKey(allowance.chainId, allowance.token.address);
    const balanceKey = getBalanceKey(allowance.chainId, allowance.token.address);
    const spenderKey = getSpenderKey(allowance.chainId, allowance.payload.spender);
    const allowanceKey = getAllowanceKey(allowance);

    const price = isHistorical || isErc721(allowance.token) ? null : priceData[priceKey];
    const balance = balanceData[balanceKey];
    const metadata = { ...allowance.metadata, price };
    const payload = {
      ...allowance.payload,
      ...revokePreparationData[allowanceKey],
      spenderData: spenderData[spenderKey],
    };

    return { ...allowance, balance, metadata, payload };
  });
};

const hasPayload = (allowance: TokenAllowanceData): allowance is AllowanceWithPayload => {
  return !isNullish(allowance.payload);
};
