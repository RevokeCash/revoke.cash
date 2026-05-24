'use client';

import type { ColumnSort } from '@tanstack/react-table';
import EmptyChainsSection from 'components/common/EmptyChainsSection';
import PremiumChainStatusSection from 'components/common/PremiumChainStatusSection';
import { usePremiumAddressPageContext } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import ChainAllowanceSection from './ChainAllowanceSection';
import { ColumnId } from './columns';
import PremiumAllowanceTableControls from './controls/PremiumAllowanceTableControls';

const PremiumAllowanceDashboard = () => {
  const t = useTranslations();
  const { chainData, onUpdate } = usePremiumAddressPageContext();
  const [sorting, setSorting] = useState<ColumnSort[]>([{ id: ColumnId.LAST_UPDATED, desc: true }]);
  const [spenderFilters, setSpenderFilters] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(true);

  const chainsWithContent = chainData.filter(
    (chain) => chain.status === 'loading' || chain.status === 'error' || chain.allowances.length > 0,
  );
  const emptyChains = chainData.filter((chain) => chain.status === 'success' && chain.allowances.length === 0);

  return (
    <div className="flex flex-col gap-2">
      <PremiumChainStatusSection chainStatuses={chainData} />
      <PremiumAllowanceTableControls
        onSortChange={setSorting}
        onSearchValuesChange={setSpenderFilters}
        onToggleExpandAll={() => setAllExpanded((value) => !value)}
        isAllExpanded={allExpanded}
      />
      {chainsWithContent.map((chain) => (
        <ChainAllowanceSection
          key={chain.chainId}
          chainData={chain}
          onUpdate={onUpdate}
          sorting={sorting}
          spenderFilters={spenderFilters}
          allExpanded={allExpanded}
        />
      ))}
      <EmptyChainsSection
        emptyChains={emptyChains}
        description={t('address.allowances.empty_chains_count', { count: emptyChains.length })}
        allEmptyMessage={chainsWithContent.length === 0 ? t('address.allowances.none_found_premium') : undefined}
      />
    </div>
  );
};

export default PremiumAllowanceDashboard;
