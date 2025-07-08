'use client';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import HistoryTable from './HistoryTable';

const HistoryDashboard = () => {
  const t = useTranslations();
  const isMounted = useMounted();

  return <div className="flex flex-col gap-2">{isMounted && <HistoryTable />}</div>;
};

export default HistoryDashboard;
