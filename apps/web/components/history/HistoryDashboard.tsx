'use client';

import HistoryTable from './HistoryTable';
import PremiumHistoryTable from './PremiumHistoryTable';

interface Props {
  isPremium?: boolean;
}

const HistoryDashboard = ({ isPremium }: Props) => {
  return <div className="flex flex-col gap-2">{isPremium ? <PremiumHistoryTable /> : <HistoryTable />}</div>;
};

export default HistoryDashboard;
