'use client';

import type { AddressIndexerState } from '@revoke.cash/core/admin/lookup';
import { getChainName } from '@revoke.cash/core/chains';
import { createColumnHelper } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import ChainLogo from 'components/common/ChainLogo';
import StatusLabel from 'components/common/StatusLabel';
import TimeAgo from 'components/common/TimeAgo';
import Table from 'components/common/table/Table';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useResetIndexing } from 'lib/hooks/admin/useAdminLookup';
import { useTable } from 'lib/hooks/useTable';
import { twMerge } from 'tailwind-merge';
import type { Address } from 'viem';

interface Props {
  address: Address;
  indexerStates?: AddressIndexerState[];
  isLoading: boolean;
}

const columnHelper = createColumnHelper<AddressIndexerState>();

const columns = [
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="flex items-center gap-2 py-2 pr-4">
        <ChainLogo chainId={info.getValue()} size={20} />
        {getChainName(info.getValue())}
      </div>
    ),
  }),
  columnHelper.accessor('lastScanAt', {
    id: 'lastScan',
    header: 'Last scan',
    cell: (info) => (
      <div className="py-2 pr-4">
        <TimestampDisplay timestamp={info.getValue()} fallback="never" />
      </div>
    ),
  }),
  columnHelper.accessor('nextRunAt', {
    id: 'nextRun',
    header: 'Next run',
    cell: (info) => (
      <div className="py-2 pr-4">
        <TimestampDisplay timestamp={info.getValue()} fallback="-" />
      </div>
    ),
  }),
  columnHelper.accessor('consecutiveFailures', {
    id: 'failures',
    header: 'Failures',
    cell: (info) => (
      <div className="py-2 pr-4">
        <span className={twMerge(info.getValue() > 0 && 'text-red-600 dark:text-red-400 font-medium')}>
          {info.getValue()}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor('lastError', {
    id: 'lastError',
    header: 'Last error',
    cell: (info) => {
      const lastError = info.getValue();

      return (
        <div className="py-2 pr-4">
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
  columnHelper.display({
    id: 'flags',
    header: 'Flags',
    cell: (info) => {
      const state = info.row.original;

      return (
        <div className="flex flex-wrap items-center gap-1 py-2">
          {state.disabledAt && (
            <WithHoverTooltip tooltip={`Disabled at ${state.disabledAt}`}>
              <StatusLabel status="danger" className="py-0.75">
                disabled
              </StatusLabel>
            </WithHoverTooltip>
          )}
          {state.evaluationPending && (
            <WithHoverTooltip
              tooltip={`Computed at ${state.computedAt}, last evaluated ${state.lastEvaluatedAt ?? 'never'}`}
            >
              <StatusLabel status="warning" className="py-0.75">
                evaluation pending
              </StatusLabel>
            </WithHoverTooltip>
          )}
          {!state.disabledAt && !state.evaluationPending && <span className="text-zinc-500">-</span>}
        </div>
      );
    },
  }),
];

const IndexingHealthCard = ({ address, indexerStates, isLoading }: Props) => {
  const resetIndexing = useResetIndexing(address);

  const table = useTable({
    data: indexerStates ?? [],
    columns,
    getRowId: (row) => String(row.chainId),
  });

  return (
    <Card
      header={<CardTitle title="Indexing health" subtitle="Event scanning and allowance evaluation state per chain" />}
      className="p-0"
    >
      {indexerStates && (
        <div className="flex justify-end p-4 border-b border-zinc-200 dark:border-zinc-700">
          <Button style="secondary" size="sm" onClick={() => resetIndexing.mutate()} loading={resetIndexing.isPending}>
            Reset indexing
          </Button>
        </div>
      )}
      <Table
        table={table}
        loading={isLoading}
        emptyChildren="This address is not registered for indexing on any chain."
        className="border-none"
      />
    </Card>
  );
};

const TimestampDisplay = ({ timestamp, fallback }: { timestamp: string | null; fallback: string }) => {
  if (!timestamp) return <span className="text-zinc-500">{fallback}</span>;

  return (
    <WithHoverTooltip tooltip={timestamp}>
      <span>
        <TimeAgo datetime={new Date(timestamp)} />
      </span>
    </WithHoverTooltip>
  );
};

export default IndexingHealthCard;
