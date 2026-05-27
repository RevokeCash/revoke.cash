import { createViemPublicClientForChain, type DocumentedChainId } from '@revoke.cash/core/chains';
import { type CachedAddressDataDto, deserializeCachedAddressData } from '@revoke.cash/core/indexer/allowances-dto';
import { isNullish } from '@revoke.cash/core/utils';
import { useQueries } from '@tanstack/react-query';
import { dtoKy } from 'lib/ky';
import analytics from 'lib/utils/analytics';
import type { Address } from 'viem';
import { queryClient } from '../QueryProvider';
import type { CombinedQueryResult } from './combined-query-result';
import type { AddressData } from './useAddressData';

export interface PremiumAddressDataResult extends CombinedQueryResult<AddressData> {
  isRefreshing: boolean;
  refreshError: Error | null;
  refresh: () => void;
}

type AddressDataQueryType = 'cached' | 'refresh';

const ADDRESS_DATA_QUERY_TYPES: AddressDataQueryType[] = ['cached', 'refresh'];

export const usePremiumAddressData = (
  address: Address,
  chains: readonly DocumentedChainId[],
): PremiumAddressDataResult[] => {
  const cachedResults = useQueries({
    queries: chains.map((chainId) => ({
      queryKey: getAddressDataQueryKey(address, chainId, 'cached'),
      queryFn: () => fetchAddressData(address, chainId, 'GET'),
      enabled: !isNullish(address) && !isNullish(chainId),
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
    })),
  });

  const refreshResults = useQueries({
    queries: chains.map((chainId) => ({
      queryKey: getAddressDataQueryKey(address, chainId, 'refresh'),
      queryFn: async () => {
        const data = await fetchAddressData(address, chainId, 'POST');
        queryClient.setQueryData(getAddressDataQueryKey(address, chainId, 'cached'), data);
        return data;
      },
      enabled: !isNullish(address) && !isNullish(chainId),
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      retry: false,
    })),
  });

  return chains.map((_chainId, index) => {
    const cachedResult = cachedResults[index];
    const refreshResult = refreshResults[index];
    const isRefreshing = Boolean(refreshResult?.isFetching);
    const data = refreshResult?.data ?? cachedResult?.data;
    const refreshError = isRefreshing ? null : (refreshResult?.error ?? null);
    const error = isRefreshing ? null : (refreshError ?? (data ? null : (cachedResult?.error ?? null)));

    return {
      data,
      error,
      isLoading: !data && (isRefreshing || Boolean(cachedResult?.isLoading)),
      isSuccess: !error && (Boolean(data) || Boolean(cachedResult?.isSuccess)),
      isRefreshing,
      refreshError,
      refresh: () => {
        void refreshResult?.refetch();
      },
    };
  });
};

export const updatePremiumAddressDataCache = (
  address: Address,
  chainId: number,
  updateAddressData: (addressData: AddressData) => AddressData,
) => {
  ADDRESS_DATA_QUERY_TYPES.forEach((type) => {
    queryClient.setQueryData<AddressData | undefined>(getAddressDataQueryKey(address, chainId, type), (addressData) => {
      return addressData ? updateAddressData(addressData) : addressData;
    });
  });
};

const getAddressDataQueryKey = (address: Address, chainId: number, type: AddressDataQueryType) =>
  ['premium-address-data', address, chainId, type] as const;

const fetchAddressData = async (
  address: Address,
  chainId: DocumentedChainId,
  method: 'GET' | 'POST',
): Promise<AddressData> => {
  const publicClient = createViemPublicClientForChain(chainId);
  const response = await dtoKy(`/api/${chainId}/allowances/${address}`, {
    method,
    retry: 0,
  }).json<CachedAddressDataDto>();
  analytics.track(method === 'GET' ? 'Fetched Cached Address Data' : 'Refreshed Cached Address Data', {
    account: address,
    chainId,
  });
  return deserializeCachedAddressData(response, { publicClient, chainId, owner: address }) satisfies AddressData;
};
