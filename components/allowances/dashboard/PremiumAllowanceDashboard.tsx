'use client';

import { usePremiumAddressPageContext } from 'lib/hooks/page-context/PremiumAddressPageContext';
import ChainAllowanceSection from './ChainAllowanceSection';
import EmptyChainsSection from './EmptyChainsSection';

const PremiumAllowanceDashboard = () => {
  const { chainData, onUpdate } = usePremiumAddressPageContext();

  // Split chains: show individual sections for chains with allowances/loading/error,
  // collapse empty chains into a single section
  const chainsWithContent = chainData.filter(
    (chain) => chain.status === 'loading' || chain.status === 'error' || chain.allowances.length > 0,
  );
  const emptyChains = chainData.filter((chain) => chain.status === 'success' && chain.allowances.length === 0);

  return (
    <div className="flex flex-col gap-2">
      {chainsWithContent.map((chain) => (
        <ChainAllowanceSection key={chain.chainId} chainData={chain} onUpdate={onUpdate} />
      ))}
      <EmptyChainsSection emptyChains={emptyChains} />
    </div>
  );
};

export default PremiumAllowanceDashboard;
