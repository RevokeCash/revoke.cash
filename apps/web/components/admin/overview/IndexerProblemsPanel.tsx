'use client';

import type { IndexerProblemGroup, IndexingStage } from '@revoke.cash/core/admin/health';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import Button from 'components/common/Button';
import ChainDisplay from 'components/common/ChainDisplay';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAdminIndexerProblems } from 'lib/hooks/admin/useAdminHealthDetails';
import { useResetChainIndexing } from 'lib/hooks/admin/useAdminLookup';
import type { AppTableFeatures } from 'lib/utils/table';
import HealthDetailPanel from './HealthDetailPanel';

interface Props {
  isOpen: boolean;
}

const STAGE_LABELS: Record<IndexingStage, string> = {
  events: 'Events scan',
  allowances: 'Allowance recompute',
};

// A chain-wide outage can hit dozens of wallets, and the chain reset covers all of them
const MAX_LISTED_ADDRESSES = 5;

const columnHelper = createColumnHelper<AppTableFeatures, IndexerProblemGroup>();

const columns = columnHelper.columns([
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <ChainDisplay chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('stage', {
    id: 'stage',
    header: 'Stage',
    cell: (info) => <div className="py-1.5 pr-4 text-sm whitespace-nowrap">{STAGE_LABELS[info.getValue()]}</div>,
  }),
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
  columnHelper.accessor('addresses', {
    id: 'wallets',
    header: 'Wallets',
    cell: (info) => {
      const addresses = info.getValue();
      const unlistedAddressCount = addresses.length - MAX_LISTED_ADDRESSES;
      return (
        <div className="flex flex-col gap-1 py-1.5 pr-4 text-sm">
          <span className="font-medium">{addresses.length}</span>
          {addresses.slice(0, MAX_LISTED_ADDRESSES).map((address) => (
            <AdminAddressLink key={address} address={address} />
          ))}
          {unlistedAddressCount > 0 && <span className="text-zinc-500">+{unlistedAddressCount} more</span>}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => (
      <div className="py-1.5 text-sm">
        <ResetChainIndexingCell chainId={info.row.original.chainId} />
      </div>
    ),
  }),
]);

const IndexerProblemsPanel = ({ isOpen }: Props) => {
  const query = useAdminIndexerProblems(isOpen);

  return (
    <HealthDetailPanel
      isOpen={isOpen}
      query={query}
      columns={columns}
      getRowId={(group) => `${group.stage}-${group.chainId}-${group.lastError ?? ''}`}
      emptyChildren="No failing indexing for subscribed addresses"
    />
  );
};

// The reset only clears events rows, but the recompute is queued after every successful scan, so it also fixes the
// allowance stage. Per-address resets live on the Lookup page.
const ResetChainIndexingCell = ({ chainId }: { chainId: number }) => {
  const resetChainIndexing = useResetChainIndexing(chainId);

  return (
    <WithHoverTooltip tooltip="Rescan all addresses on this chain now; a successful rescan also recomputes their allowances">
      <Button
        style="secondary"
        size="sm"
        onClick={() => resetChainIndexing.mutate()}
        loading={resetChainIndexing.isPending}
      >
        Reset chain
      </Button>
    </WithHoverTooltip>
  );
};

export default IndexerProblemsPanel;
