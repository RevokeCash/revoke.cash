'use client';

import type { UnmatchedTransfer } from '@revoke.cash/core/premium/unmatched-transfers';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import ChainDisplay from 'components/common/ChainDisplay';
import { useAdminUnmatchedTransfers } from 'lib/hooks/admin/useAdminUnmatchedTransfers';
import type { AppTableFeatures } from 'lib/utils/table';
import { formatUnits } from 'viem';
import DismissUnmatchedTransferButton from './DismissUnmatchedTransferButton';
import HealthDetailPanel from './HealthDetailPanel';

interface Props {
  isOpen: boolean;
}

const columnHelper = createColumnHelper<AppTableFeatures, UnmatchedTransfer>();

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
  columnHelper.accessor('transactionHash', {
    id: 'transaction',
    header: 'Transaction',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <TransactionHashCell chainId={info.row.original.chainId} transactionHash={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('senderAddress', {
    id: 'sender',
    header: 'Sender',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <AdminAddressLink address={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('amount', {
    id: 'amount',
    header: 'Amount',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        {formatUnits(BigInt(info.getValue()), info.row.original.tokenDecimals)} {info.row.original.tokenSymbol}
      </div>
    ),
  }),
  columnHelper.accessor('createdAt', {
    id: 'detected',
    header: 'Detected',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <TimeAgoCell timestamp={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.display({
    id: 'dismissal',
    header: () => null,
    cell: (info) => {
      const unmatchedTransfer = info.row.original;
      return (
        <div className="flex justify-end py-1.5 text-sm">
          {unmatchedTransfer.dismissedAt ? (
            <span className="max-w-xs wrap-break-word text-zinc-500 dark:text-zinc-400">
              Dismissed{unmatchedTransfer.note && `: ${unmatchedTransfer.note}`}
            </span>
          ) : (
            <DismissUnmatchedTransferButton unmatchedTransfer={unmatchedTransfer} />
          )}
        </div>
      );
    },
  }),
]);

const UnmatchedTransfersPanel = ({ isOpen }: Props) => {
  const query = useAdminUnmatchedTransfers(isOpen);

  return (
    <HealthDetailPanel
      isOpen={isOpen}
      query={query}
      columns={columns}
      getRowId={(row) => row.id}
      emptyChildren="No unmatched transfers"
    />
  );
};

export default UnmatchedTransfersPanel;
