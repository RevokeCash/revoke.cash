import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { OnCancel } from 'lib/interfaces';
import { isNullish } from 'lib/utils';
import type { TimeLog } from 'lib/utils/events';
import { getLastCancelled } from 'lib/utils/permit';
import { filterAsync, mapAsync } from 'lib/utils/promises';
import { hasSupportForPermit, type PermitTokenData } from 'lib/utils/tokens';
import { useLayoutEffect, useState } from 'react';
import { useAddressAllowances, useAddressEvents, useAddressPageContext } from '../page-context/AddressPageContext';

export const usePermitTokens = () => {
  const [permitTokens, setPermitTokens] = useState<PermitTokenData[]>();
  const queryClient = useQueryClient();

  const { selectedChainId } = useAddressPageContext();
  const { ownedTokens, error: allowancesError, isLoading: isAllowancesLoading } = useAddressAllowances();
  const { events } = useAddressEvents();

  const {
    data,
    error: permitsError,
    isLoading: isPermitsLoading,
  } = useQuery({
    queryKey: ['permitTokens', ownedTokens?.map((t) => t.contract.address)],
    queryFn: async () => {
      const permitTokens = await mapAsync(
        filterAsync(ownedTokens!, (token) => hasSupportForPermit(token.contract)),
        async (token) => ({ ...token, lastCancelled: await getLastCancelled(events!, token) }),
      );

      return permitTokens;
    },
    enabled: !isNullish(ownedTokens) && !isNullish(events),
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
