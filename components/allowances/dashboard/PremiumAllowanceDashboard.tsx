'use client';

import EmptyChainsSection from 'components/common/EmptyChainsSection';
import { usePremiumAddressPageContext } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { useTranslations } from 'next-intl';
import ChainAllowanceSection from './ChainAllowanceSection';

const PremiumAllowanceDashboard = () => {
  const t = useTranslations();
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
      <EmptyChainsSection
        emptyChains={emptyChains}
        description={t('address.allowances.empty_chains_count', { count: emptyChains.length })}
      />
    </div>
  );
};

export default PremiumAllowanceDashboard;
