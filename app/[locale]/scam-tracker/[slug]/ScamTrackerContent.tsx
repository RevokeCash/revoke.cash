'use client';

import ValidatedSearchBox from 'components/common/ValidatedSearchBox';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { buildGraphData, getTokenTransfers } from 'lib/utils/token-tracking';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { PublicClient } from 'viem';
import ScamTrackerChainSelect from './ScamTrackerChainSelect';
import TransactionGraph from './TransactionGraph';

interface Props {
  chainId: number;
  chainName: string;
}

const ScamTrackerContent = ({ chainId, chainName }: Props) => {
  const t = useTranslations();

  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create the public client on the client side.
  const publicClient: PublicClient = useMemo(() => createViemPublicClientForChain(chainId), [chainId]);

  const handleTransactionSubmit = async (hash: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const transfers = await getTokenTransfers(publicClient, hash as `0x${string}`);
      const data = await buildGraphData(transfers);
      console.log('The output of buildGraphData is: ', data);

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
    <div className="flex flex-col items-center m-auto gap-4 px-4">
      <ValidatedSearchBox
        onSubmit={handleTransactionSubmit}
        validate={async (value) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return isValidHash(value.trim());
        }}
        placeholder={t('scam_tracker.placeholder')}
      />
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {isLoading && (
        <div className="flex items-center justify-center w-full h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-2 my-4">
        <p className="m-0">{t('scam_tracker.different_chain')}:</p>
        <div className="not-prose shrink-0">
          <ScamTrackerChainSelect chainId={chainId} />
        </div>
      </div>

      {/* {!graphData && !isLoading && <ChainDescription chainId={chainId} />} */}
      {graphData && <TransactionGraph data={graphData} />}
    </div>
  );
};

export default ScamTrackerContent;
