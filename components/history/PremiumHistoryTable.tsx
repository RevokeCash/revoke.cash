'use client';

import { usePremiumApprovalHistory } from 'lib/hooks/ethereum/usePremiumApprovalHistory';
import PremiumHistoryStatusSection from './PremiumHistoryStatusSection';
import SharedHistoryTable from './SharedHistoryTable';

const PremiumHistoryTable = () => {
  const { approvalHistory, chainStatuses, isLoading, error } = usePremiumApprovalHistory();
  const hasChainsStillLoading = chainStatuses.some((chain) => chain.status === 'loading');
  const tableLoading = hasChainsStillLoading || isLoading;

  return (
    <div className="flex flex-col gap-2">
      <PremiumHistoryStatusSection chainStatuses={chainStatuses} />
      <SharedHistoryTable
        approvalHistory={approvalHistory}
        isLoading={tableLoading}
        error={error}
        partialLoadingRows={3}
        autoResetPageIndex={false}
        includeChainColumn
      />
    </div>
  );
};

export default PremiumHistoryTable;
