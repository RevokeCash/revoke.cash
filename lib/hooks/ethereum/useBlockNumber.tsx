import { useQuery } from '@tanstack/react-query';
import { MINUTE } from 'lib/utils/time';
import { fetchBlockNumber } from 'wagmi/actions';

// We add this custom useBlockNumber instead of using wagmi's so that we can easily invalidate the query when needed
export const useBlockNumber = (chainId: number) => {
  return useQuery({
    queryKey: ['blockNumber', chainId],
    queryFn: async () => fetchBlockNumber({ chainId }),
    // Don't refresh the block number too often to avoid refreshing events too often, to avoid backend API rate limiting
    cacheTime: 1 * MINUTE,
    staleTime: 1 * MINUTE,
  });
};
