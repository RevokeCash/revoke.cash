'use client';

import type { DueIndexerScanRow } from '@revoke.cash/core/admin/health';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import ChainDisplay from 'components/common/ChainDisplay';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAdminDueIndexerScans } from 'lib/hooks/admin/useAdminHealthDetails';
import type { AppTableFeatures } from 'lib/utils/table';
import HealthDetailPanel from './HealthDetailPanel';

interface Props {
  isOpen: boolean;
}

const columnHelper = createColumnHelper<AppTableFeatures, DueIndexerScanRow>();

const columns = columnHelper.columns([
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
  columnHelper.accessor('nextRunAt', {
    id: 'due',
    header: 'Due since',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <TimeAgoCell timestamp={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('lastScanAt', {
    id: 'lastScan',
    header: 'Last scan',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <TimeAgoCell timestamp={info.getValue()} fallback="never" />
      </div>
    ),
  }),
  columnHelper.accessor('consecutiveFailures', {
    id: 'failures',
    header: () => <div className="text-right">Failures</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue()}</div>,
  }),
  columnHelper.accessor('lastError', {
    id: 'lastError',
    header: 'Last error',
    cell: (info) => {
      const lastError = info.getValue();
      return (
        <div className="py-1.5 text-sm">
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
]);

const DueIndexerScansPanel = ({ isOpen }: Props) => {
  const query = useAdminDueIndexerScans(isOpen);

  return (
    <HealthDetailPanel
      isOpen={isOpen}
      query={query}
      columns={columns}
      getRowId={(row) => `${row.address}-${row.chainId}`}
      emptyChildren="No indexer scans are due"
    />
  );
};

export default DueIndexerScansPanel;
