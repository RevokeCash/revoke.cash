import { type Filter } from 'lib/utils/events';
import { useBlockNumber } from './useBlockNumber';
import { useLogs } from './useLogs';

export const useLogsFullBlockRange = (name: string, chainId: number, filter?: Pick<Filter, 'address' | 'topics'>) => {
  const { data: blockNumber, isLoading: isBlockNumberLoading, error: blockNumberError } = useBlockNumber(chainId);
  const result = useLogs(
    name,
    chainId,
    filter && blockNumber ? { ...filter, fromBlock: 0, toBlock: blockNumber } : undefined,
  );
  return { ...result, isLoading: result.isLoading || isBlockNumberLoading, error: result.error || blockNumberError };
};
