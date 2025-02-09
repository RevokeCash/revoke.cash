'use client';
import { buildGraphData, getTokenTransfers } from 'lib/utils/token-tracking';
import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import TransactionGraph from './TransactionGraph';

interface Props {
  chainId: number;
}

const ScamTrackerContent = ({ chainId }: Props) => {
  const publicClient = usePublicClient();

  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransactionSubmit = async (hash: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const transfers = await getTokenTransfers(publicClient, hash as `0x${string}`);
      const data = await buildGraphData(transfers);

      setGraphData(data);
    } catch (err) {
      console.error('Error fetching transaction data:', err);
      setError('Failed to fetch transaction data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center m-auto gap-4 px-4">
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {isLoading && (
        <div className="flex items-center justify-center w-full h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
        </div>
      )}
      {graphData && <TransactionGraph data={graphData} />}
    </div>
  );
};

export default ScamTrackerContent;
