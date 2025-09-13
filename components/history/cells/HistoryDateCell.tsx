import { useQuery } from '@tanstack/react-query';
import LastUpdatedCell from 'components/allowances/dashboard/cells/LastUpdatedCell';
import blocksDB from 'lib/databases/blocks';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import type { TimeLog } from 'lib/utils/events';

interface Props {
  timeLog: TimeLog;
  chainId: number;
}

const HistoryDateCell = ({ timeLog, chainId }: Props) => {
  const { data: completeTimeLog } = useQuery({
    queryKey: ['timeLog', timeLog.blockNumber, chainId],
    queryFn: async () => {
      // If we already have a timestamp, return as-is
      if (timeLog.timestamp) {
        return timeLog;
      }

      // Fetch timestamp from block number
      const publicClient = createViemPublicClientForChain(chainId);
      return await blocksDB.getTimeLog(publicClient, timeLog);
    },
    staleTime: Number.POSITIVE_INFINITY, // Block timestamps never change
    retry: false,
  });

  // Show nothing while loading, or if we can't get the timestamp
  if (!completeTimeLog) {
    return null;
  }

  // Use the existing LastUpdatedCell with complete time data
  return <LastUpdatedCell lastUpdated={completeTimeLog} chainId={chainId} />;
};

export default HistoryDateCell;
