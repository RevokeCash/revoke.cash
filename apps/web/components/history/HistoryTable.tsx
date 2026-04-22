import { useApprovalHistory } from 'lib/hooks/ethereum/useApprovalHistory';
import SharedHistoryTable from './SharedHistoryTable';

const HistoryTable = () => {
  const { approvalHistory, isLoading, error } = useApprovalHistory();
  return <SharedHistoryTable approvalHistory={approvalHistory} isLoading={isLoading} error={error ?? undefined} />;
};

export default HistoryTable;
