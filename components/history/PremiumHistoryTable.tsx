'use client';

import PremiumChainStatusSection from 'components/common/PremiumChainStatusSection';
import { usePremiumApprovalHistory } from 'lib/hooks/ethereum/usePremiumApprovalHistory';
import SharedHistoryTable from './SharedHistoryTable';

const PremiumHistoryTable = () => {
  const { approvalHistory, chainStatuses, isLoading, error } = usePremiumApprovalHistory();
  const hasChainsStillLoading = chainStatuses.some((chain) => chain.status === 'loading');
  const tableLoading = hasChainsStillLoading || isLoading;

  return (
    <div className="flex flex-col gap-2">
      <PremiumChainStatusSection chainStatuses={chainStatuses} />
      <SharedHistoryTable approvalHistory={approvalHistory} isLoading={tableLoading} error={error} isPremium />
    </div>
  );
};

export default PremiumHistoryTable;
