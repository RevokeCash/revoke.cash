'use client';

import AddressDisplay from 'components/address/AddressDisplay';
import AllowanceDashboard from 'components/allowances/dashboard/AllowanceDashboard';
import ChainSelect from 'components/common/select/ChainSelect';
import { useAddressAllowances, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useEffect } from 'react';
import { useChainId } from 'wagmi';
import { useEmbedConfig } from '../lib/context';

const EmbedDashboard = () => {
  const { allowances } = useAddressAllowances();
  const { address, domainName, selectedChainId, selectChain } = useAddressPageContext();
  const { renderShareAction, type, showChainSelect = true } = useEmbedConfig();
  const walletChainId = useChainId();

  // Sync the dashboard chain with the wallet's chain when it changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when the wallet's chain changes, not when the dashboard selection changes
  useEffect(() => {
    if (walletChainId && walletChainId !== selectedChainId) {
      selectChain(walletChainId);
    }
  }, [walletChainId]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
        <AddressDisplay address={address} domainName={domainName} className="text-4xl font-bold" withTooltip />

        <div className="flex flex-wrap items-center justify-center gap-2">
          {showChainSelect && (
            <ChainSelect
              instanceId={`${type}-chain-select`}
              selected={selectedChainId}
              onSelect={selectChain}
              showNames
              menuAlign="right"
            />
          )}
          {renderShareAction?.({ allowances })}
        </div>
      </div>

      {/* Allowances Table */}
      <AllowanceDashboard />
    </div>
  );
};

export default EmbedDashboard;
