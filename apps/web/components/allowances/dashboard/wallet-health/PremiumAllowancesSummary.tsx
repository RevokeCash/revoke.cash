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
    <div className="flex justify-start items-start md:items-center md:justify-around gap-4">
      <AllowancesCount allowances={allowances} isLoading={isLoading} multichain />
      <TotalValueAtRisk allowances={allowances} isLoading={isLoading} multichain />
    </div>
  );
};

export default PremiumAllowancesSummary;
