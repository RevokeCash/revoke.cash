'use client';

import type { ProblemAction } from '@revoke.cash/core/admin/executor';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import { useAdminExecutorProblems } from 'lib/hooks/admin/useAdminExecutor';
import { useTable } from 'lib/hooks/useTable';

const columnHelper = createColumnHelper<ProblemAction>();

const columns = [
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <ChainDisplay chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('lane', {
    id: 'lane',
    header: 'Lane',
    cell: (info) => <div className="py-1.5 pr-4">{info.getValue() ?? '-'}</div>,
  }),
  columnHelper.accessor('address', {
    id: 'address',
    header: 'Address',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <AdminAddressLink address={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('nonce', {
    id: 'nonce',
    header: 'Nonce',
    cell: (info) => <div className="py-1.5 pr-4">{info.getValue() ?? '-'}</div>,
  }),
  columnHelper.accessor('txHash', {
    id: 'transaction',
    header: 'Transaction',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <TransactionHashCell chainId={info.row.original.chainId} transactionHash={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('submittedAt', {
    id: 'submitted',
    header: 'Submitted',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <TimeAgoCell timestamp={info.getValue()} />
      </div>
    ),
  }),
];

const StuckSubmittedSection = () => {
  const { data, isLoading } = useAdminExecutorProblems();

  const table = useTable({
    data: data?.stuckSubmitted ?? [],
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Stuck submitted actions"
          subtitle="Submitted over 30 minutes ago without settling. These rows are executor-owned and read-only; retrying them here would corrupt the nonce pipeline."
        />
      }
      className="p-0"
    >
      <Table table={table} loading={isLoading} emptyChildren="No stuck submitted actions" className="border-none" />
    </Card>
  );
};

export default StuckSubmittedSection;
