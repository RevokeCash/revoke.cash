'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ExecutorPipeline } from '@revoke.cash/core/admin/executor';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAdminExecutorPipelines, useAdminExecutorProblems } from 'lib/hooks/admin/useAdminExecutor';
import { useTable } from 'lib/hooks/useTable';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

interface PipelineRow extends ExecutorPipeline {
  maxPendingPerChain: number;
  hasStuckHeadOfLine: boolean;
}

const columnHelper = createColumnHelper<PipelineRow>();

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
    cell: (info) => <div className="py-1.5 pr-4">{info.getValue()}</div>,
  }),
  columnHelper.accessor('inFlightCount', {
    id: 'inFlight',
    header: 'In flight',
    cell: (info) => {
      const { maxPendingPerChain } = info.row.original;
      const isFull = info.getValue() >= maxPendingPerChain;

      return (
        <div className={twMerge('py-1.5 pr-4', isFull && 'text-red-600 dark:text-red-400 font-medium')}>
          {info.getValue()} / {maxPendingPerChain}
          {isFull && ' (full)'}
        </div>
      );
    },
  }),
  columnHelper.accessor('minNonce', {
    id: 'minNonce',
    header: 'Min nonce',
    cell: (info) => (
      <div className="flex items-center gap-1 py-1.5 pr-4">
        {info.getValue() ?? '-'}
        {info.row.original.hasStuckHeadOfLine && (
          <WithHoverTooltip tooltip="The head-of-line transaction at this nonce has been in flight for over 30 minutes, blocking the rest of the pipeline">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </WithHoverTooltip>
        )}
      </div>
    ),
  }),
  columnHelper.accessor('maxAssignedNonce', {
    id: 'maxAssignedNonce',
    header: 'Max assigned nonce',
    cell: (info) => <div className="py-1.5 pr-4">{info.getValue() ?? '-'}</div>,
  }),
];

const ExecutorPipelinesSection = () => {
  const pipelinesQuery = useAdminExecutorPipelines();
  const problemsQuery = useAdminExecutorProblems();

  const rows: PipelineRow[] = useMemo(() => {
    const pipelines = pipelinesQuery.data?.pipelines ?? [];
    const maxPendingPerChain = pipelinesQuery.data?.maxPendingPerChain ?? 0;
    const stuckSubmitted = problemsQuery.data?.stuckSubmitted ?? [];

    return pipelines.map((pipeline) => {
      // A stuck action at the pipeline's minimum nonce blocks everything queued behind it
      const hasStuckHeadOfLine =
        pipeline.minNonce !== null &&
        pipeline.inFlightCount > 0 &&
        stuckSubmitted.some(
          (action) =>
            action.chainId === pipeline.chainId && action.lane === pipeline.lane && action.nonce === pipeline.minNonce,
        );

      return { ...pipeline, maxPendingPerChain, hasStuckHeadOfLine };
    });
  }, [pipelinesQuery.data, problemsQuery.data]);

  const table = useTable({
    data: rows,
    columns,
    getRowId: (row) => `${row.chainId}-${row.lane}`,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Executor pipelines"
          subtitle="In-flight transactions and assigned nonces per chain and lane"
        />
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={pipelinesQuery.isLoading}
        emptyChildren="No executor pipelines with assigned nonces yet"
        className="border-none"
      />
    </Card>
  );
};

export default ExecutorPipelinesSection;
