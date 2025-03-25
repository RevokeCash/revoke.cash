'use client';

import ValidatedSearchBox from 'components/common/ValidatedSearchBox';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { buildGraph } from 'lib/utils/token-tracking';
// import { buildGraphData, getTokenTransfers } from 'lib/utils';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { Hex, PublicClient } from 'viem';
import ScamTrackerChainSelect from './ScamTrackerChainSelect';
import TransactionGraph from './TransactionGraph';

interface Props {
  chainId: number;
  chainName: string;
}

const ScamTrackerContent = ({ chainId }: Props) => {
  const t = useTranslations();

  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create the public client on the client side.
  const publicClient: PublicClient = useMemo(() => createViemPublicClientForChain(chainId), [chainId]);

  const handleTransactionSubmit = async (hash: Hex) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await buildGraph(publicClient, hash);
      console.log(data);

      // const tx = await publicClient.getTransaction({ hash });
      // const transfers = await getTokenTransfers(publicClient, hash);
      setGraphData(data);
    } catch (err) {
      console.error('Error fetching transaction data:', err);
      setError('Failed to fetch transaction data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidHash = (hash: string) => /^0x([A-Fa-f0-9]{64})$/.test(hash);

  return (
    <div className="flex flex-col w-full items-center m-auto gap-4 px-4">
      <div className="flex flex-row items-center justify-between w-full md:w-10/12 xl:w-1/2 gap-2 md:gap-4">
        <ValidatedSearchBox
          className="w-full"
          onSubmit={(value) => handleTransactionSubmit(value as Hex)}
          validate={async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return isValidHash(value.trim());
          }}
          placeholder={t('scam_tracker.placeholder')}
        />

        <div className="flex flex-col sm:flex-row items-center gap-2 my-4">
          <div className="not-prose shrink-0">
            <ScamTrackerChainSelect chainId={chainId} />
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full items-center m-auto gap-4 px-4">
        {error && <div className="text-red-500 mt-2">{error}</div>}

        {isLoading && (
          <div className="flex items-center justify-center w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
          </div>
        )}
      </div>

      {graphData && <TransactionGraph data={graphData} />}
    </div>
  );
};

export default ScamTrackerContent;
