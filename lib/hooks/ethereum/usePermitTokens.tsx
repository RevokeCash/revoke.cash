import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { OnCancel } from 'lib/interfaces';
import { deduplicateArray, isNullish } from 'lib/utils';
import { getAllowanceKey, stripAllowanceData } from 'lib/utils/allowances';
import type { TimeLog } from 'lib/utils/events';
import { getLastCancelled } from 'lib/utils/permit';
import { filterAsync, mapAsync } from 'lib/utils/promises';
import { type PermitTokenData, hasSupportForPermit, hasZeroBalance } from 'lib/utils/tokens';
import { useLayoutEffect, useState } from 'react';
import { useAddressAllowances, useAddressEvents, useAddressPageContext } from '../page-context/AddressPageContext';

export const usePermitTokens = () => {
  const [permitTokens, setPermitTokens] = useState<PermitTokenData[]>();
  const queryClient = useQueryClient();

  const { selectedChainId } = useAddressPageContext();
  const { allowances, error: allowancesError, isLoading: isAllowancesLoading } = useAddressAllowances();
  const { events } = useAddressEvents();

  const {
    data,
    error: permitsError,
    isLoading: isPermitsLoading,
  } = useQuery({
    queryKey: ['permitTokens', allowances?.map(getAllowanceKey)],
    queryFn: async () => {
      const ownedTokens = deduplicateArray(allowances!, (allowance) => allowance.contract.address)
        .filter((token) => !hasZeroBalance(token.balance, token.metadata.decimals) && token)
        .map(stripAllowanceData);

      const permitTokens = await mapAsync(
        filterAsync(ownedTokens, (token) => hasSupportForPermit(token.contract)),
        async (token) => ({ ...token, lastCancelled: await getLastCancelled(events!, token) }),
      );

      return permitTokens;
    },
    enabled: !isNullish(allowances) && !isNullish(events),
    staleTime: Number.POSITIVE_INFINITY,
  });

  useLayoutEffect(() => {
    if (data) {
      setPermitTokens(data);
    }
  }, [data]);

  const error = allowancesError || permitsError;
  const isLoading = (isAllowancesLoading || isPermitsLoading || !permitTokens) && !error;

  const onCancel: OnCancel<PermitTokenData> = async (token: PermitTokenData, lastCancelled: TimeLog) => {
    await queryClient.invalidateQueries({
      queryKey: ['blockNumber', selectedChainId],
      refetchType: 'none',
    });

    const permitTokenEquals = (a: PermitTokenData, b: PermitTokenData) => {
      return a.contract.address === b.contract.address && a.chainId === b.chainId;
    };

    setPermitTokens((previousPermitTokens) => {
      return previousPermitTokens!.map((other) => {
        if (!permitTokenEquals(other, token)) return other;

        const newPermitTokenData = { ...other, lastCancelled };
        return newPermitTokenData;
      });
    });
  };

  return { permitTokens, isLoading, error, onCancel };
};
