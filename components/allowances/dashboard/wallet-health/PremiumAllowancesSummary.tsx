'use client';

import { usePremiumAddressPageContext } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { useMemo } from 'react';
import AllowancesCount from './AllowanceCount';
import TotalValueAtRisk from './TotalValueAtRisk';

const PremiumAllowancesSummary = () => {
  const { chainData } = usePremiumAddressPageContext();

  const allowances = useMemo(() => chainData.flatMap((chain) => chain.allowances), [chainData]);
  const isLoading = useMemo(() => chainData.some((chain) => chain.status === 'loading'), [chainData]);
  const allChainsFailed = useMemo(() => chainData.every((chain) => chain.status === 'error'), [chainData]);

  if (allChainsFailed) return null;

  return (
    <div className="flex items-center justify-around gap-4 h-16 only:w-full only:justify-center">
      <AllowancesCount allowances={allowances} isLoading={isLoading} />
      <TotalValueAtRisk allowances={allowances} isLoading={isLoading} />
    </div>
  );
};

export default PremiumAllowancesSummary;
