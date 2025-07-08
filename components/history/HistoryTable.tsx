import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useApprovalHistory } from 'lib/hooks/ethereum/useApprovalHistory';
import type { ApprovalTokenEvent } from 'lib/utils/events';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { columns } from './columns';

const HistoryTable = () => {
  const t = useTranslations();
  const { approvalHistory, isLoading, error } = useApprovalHistory();

  const data = useMemo(() => approvalHistory ?? [], [approvalHistory]);

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.history.title')}</div>
    </div>
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel<ApprovalTokenEvent>(),
    getSortedRowModel: getSortedRowModel<ApprovalTokenEvent>(),
    getFilteredRowModel: getFilteredRowModel<ApprovalTokenEvent>(),
    getRowId(row, index) {
      return `${row.time.transactionHash}-${index}`;
    },
  });

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('address.history.none_found')}
        loaderRows={2}
        className="border-none"
      />
    </Card>
  );
};

export default HistoryTable;
