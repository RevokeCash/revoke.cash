'use client';

import type { ProblemAction } from '@revoke.cash/core/admin/executor';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import { useAdminExecutorProblems, useAdminRetryAction } from 'lib/hooks/admin/useAdminExecutor';
import { useTable } from 'lib/hooks/useTable';

const columnHelper = createColumnHelper<ProblemAction>();

const buildColumns = (retryAction: ReturnType<typeof useAdminRetryAction>) => [
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
  columnHelper.accessor('errorCode', {
    id: 'errorCode',
    header: 'Error code',
    cell: (info) => <div className="py-1.5 pr-4 font-mono text-xs">{info.getValue() ?? '-'}</div>,
  }),
  columnHelper.accessor('costDeferredAt', {
    id: 'deferred',
    header: 'Deferred',
    cell: (info) => <TimeAgoCell timestamp={info.getValue()} />,
  }),
  columnHelper.accessor('nextRetryAt', {
    id: 'nextRetry',
    header: 'Next retry',
    cell: (info) => <TimeAgoCell timestamp={info.getValue()} />,
  }),
  columnHelper.display({
    id: 'retry',
    header: () => null,
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <Button
          style="secondary"
          size="sm"
          disabled={retryAction.isPending}
          loading={retryAction.isPending && retryAction.variables === info.row.original.id}
          onClick={() => retryAction.mutate(info.row.original.id)}
        >
          Retry now
        </Button>
      </div>
    ),
  }),
];

const DeferredActionsSection = () => {
  const { data, isLoading } = useAdminExecutorProblems();
  const retryAction = useAdminRetryAction();

  const table = useTable({
    data: data?.deferred ?? [],
    columns: buildColumns(retryAction),
    getRowId: (row) => row.id,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Deferred actions"
          subtitle="Waiting for cheaper gas or budget headroom. Retry now clears the wait and lets the executor pick them up immediately."
        />
      }
      className="p-0"
    >
      <Table table={table} loading={isLoading} emptyChildren="No deferred actions" className="border-none" />
    </Card>
  );
};

export default DeferredActionsSection;
