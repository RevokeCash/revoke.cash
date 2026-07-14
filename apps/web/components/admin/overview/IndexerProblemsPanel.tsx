'use client';

import type { IndexerProblemKind, IndexerProblemRow } from '@revoke.cash/core/admin/health';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import Button from 'components/common/Button';
import ChainDisplay from 'components/common/ChainDisplay';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAdminIndexerProblems } from 'lib/hooks/admin/useAdminHealthDetails';
import { useResetIndexing } from 'lib/hooks/admin/useAdminLookup';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import type { Address } from 'viem';
import HealthDetailPanel from './HealthDetailPanel';

interface Props {
  kind: IndexerProblemKind;
  isOpen: boolean;
}

const columnHelper = createColumnHelper<IndexerProblemRow>();

// The Disabled column only applies to indexer rows that were disabled after repeated failures
const buildIndexerProblemColumns = (kind: IndexerProblemKind) => [
  columnHelper.accessor('address', {
    id: 'address',
    header: 'Address',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <AdminAddressLink address={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <ChainDisplay chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('consecutiveFailures', {
    id: 'failures',
    header: 'Failures',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <span className={twMerge(info.getValue() > 0 && 'text-red-600 dark:text-red-400 font-medium')}>
          {info.getValue()}
        </span>
      </div>
    ),
  }),
  ...(kind === 'disabled'
    ? [
        columnHelper.accessor('disabledAt', {
          id: 'disabled',
          header: 'Disabled',
          cell: (info) => (
            <div className="py-1.5 pr-4 text-sm">
              <TimeAgoCell timestamp={info.getValue()} />
            </div>
          ),
        }),
      ]
    : []),
  columnHelper.accessor('lastError', {
    id: 'lastError',
    header: 'Last error',
    cell: (info) => {
      const lastError = info.getValue();
      return (
        <div className="py-1.5 pr-4 text-sm">
          {lastError ? (
            <WithHoverTooltip tooltip={lastError}>
              <span className="block max-w-60 truncate text-red-600 dark:text-red-400">{lastError}</span>
            </WithHoverTooltip>
          ) : (
            <span className="text-zinc-500">-</span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('nextRunAt', {
    id: 'nextRun',
    header: 'Next run',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <TimeAgoCell timestamp={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => (
      <div className="py-1.5 text-sm">
        <ResetIndexingCell address={info.row.original.address} />
      </div>
    ),
  }),
];

const IndexerProblemsPanel = ({ kind, isOpen }: Props) => {
  const query = useAdminIndexerProblems(kind, isOpen);

  const columns = useMemo(() => buildIndexerProblemColumns(kind), [kind]);

  return (
    <HealthDetailPanel
      isOpen={isOpen}
      query={query}
      columns={columns}
      getRowId={(row) => `${row.address}-${row.chainId}`}
      emptyChildren={`No ${kind} indexer rows`}
    />
  );
};

const ResetIndexingCell = ({ address }: { address: Address }) => {
  const resetIndexing = useResetIndexing(address);

  return (
    <Button style="secondary" size="sm" onClick={() => resetIndexing.mutate()} loading={resetIndexing.isPending}>
      Reset indexing
    </Button>
  );
};

export default IndexerProblemsPanel;
