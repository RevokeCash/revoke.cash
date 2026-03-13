'use client';

import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import { useAccount } from 'wagmi';
import { useAutoConnectStatus, useEmbedConfig } from '../lib/context';
import EmbedDashboard from './EmbedDashboard';
import EmbedLoadingScreen from './EmbedLoadingScreen';

const EmbedPageContent = () => {
  const { address } = useAccount();
  const { defaultChainId } = useEmbedConfig();
  const status = useAutoConnectStatus();

  if (status === 'connecting') {
    return <EmbedLoadingScreen />;
  }

  if (status === 'failed' || !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-8">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Connection Failed</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            Could not connect to your wallet. Please make sure you are accessing this page from a supported app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AddressPageContextProvider address={address} initialChainId={defaultChainId}>
      <EmbedDashboard />
    </AddressPageContextProvider>
  );
};

export default EmbedPageContent;
