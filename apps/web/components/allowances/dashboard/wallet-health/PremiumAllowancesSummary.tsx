'use client';

import { usePremiumAddressPageContext } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { useMemo } from 'react';
import AllowancesCount from './AllowanceCount';
import TotalValueAtRisk from './TotalValueAtRisk';

const PremiumAllowancesSummary = () => {
  const { chainData } = usePremiumAddressPageContext();

  const allowances = useMemo(() => chainData.flatMap((chain) => chain.allowances), [chainData]);
  const isLoading = useMemo(() => chainData.some((chain) => chain.status === 'loading'), [chainData]);
  const hasLoadedAnyChain = useMemo(() => chainData.some((chain) => chain.status === 'success'), [chainData]);
  const allChainsFailed = useMemo(() => chainData.every((chain) => chain.status === 'error'), [chainData]);

  if (allChainsFailed) return null;

  // Show a running total as soon as the first chain loads instead of a skeleton until the last one
  const showSkeleton = isLoading && !hasLoadedAnyChain;
  const isCounting = isLoading && hasLoadedAnyChain;

  return (
    <div className="flex justify-start items-start md:items-center md:justify-around gap-4">
      <AllowancesCount allowances={allowances} isLoading={showSkeleton} isCounting={isCounting} />
      <TotalValueAtRisk allowances={allowances} isLoading={showSkeleton} isCounting={isCounting} />
    </div>
  );
};

export default PremiumAllowancesSummary;
