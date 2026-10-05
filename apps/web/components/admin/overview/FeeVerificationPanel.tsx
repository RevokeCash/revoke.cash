'use client';

import type { FeeVerificationProblemKind, FeeVerificationProblemRow } from '@revoke.cash/core/admin/health';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import ChainDisplay from 'components/common/ChainDisplay';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAdminFeeVerificationRows } from 'lib/hooks/admin/useAdminHealthDetails';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import HealthDetailPanel from './HealthDetailPanel';

interface Props {
  kind: FeeVerificationProblemKind;
  isOpen: boolean;
}

const columnHelper = createColumnHelper<AppTableFeatures, FeeVerificationProblemRow>();

const buildFeeVerificationColumns = (kind: FeeVerificationProblemKind) =>
  columnHelper.columns([
    columnHelper.accessor('chainId', {
      id: 'chain',
      header: 'Chain',
      cell: (info) => (
        <div className="py-1.5 pr-4 text-sm">
          <ChainDisplay chainId={info.getValue()} />
        </div>
      ),
    }),
    ...(kind === 'failed'
      ? [
          columnHelper.accessor('feeVerificationError', {
            id: 'error',
            header: 'Error',
            cell: (info) => {
              const error = info.getValue();
              return (
                <div className="py-1.5 pr-4 text-sm">
                  {error ? (
                    <WithHoverTooltip tooltip={error}>
                      <span className="block max-w-60 truncate text-red-600 dark:text-red-400">{error}</span>
                    </WithHoverTooltip>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </div>
              );
            },
          }),
        ]
      : []),
    columnHelper.accessor('feeTransactionHash', {
      id: 'feeTransaction',
      header: 'Fee tx',
      cell: (info) => (
        <div className="py-1.5 pr-4 text-sm">
          <TransactionHashCell chainId={info.row.original.chainId} transactionHash={info.getValue()} />
        </div>
      ),
    }),
    columnHelper.accessor('userAddress', {
      id: 'user',
      header: 'User',
      cell: (info) => {
        const userAddress = info.getValue();
        return (
          <div className="py-1.5 pr-4 text-sm">
            {userAddress ? <AdminAddressLink address={userAddress} /> : <span className="text-zinc-500">-</span>}
          </div>
        );
      },
    }),
    columnHelper.accessor('feeUsdCents', {
      id: 'fee',
      header: 'Fee',
      cell: (info) => <div className="py-1.5 pr-4 text-sm">{formatUsdCents(info.getValue())}</div>,
    }),
    columnHelper.accessor('timestamp', {
      id: 'reported',
      header: 'Reported',
      cell: (info) => (
        <div className="py-1.5 text-sm">
          <TimeAgoCell timestamp={info.getValue()} />
        </div>
      ),
    }),
  ]);

const FeeVerificationPanel = ({ kind, isOpen }: Props) => {
  const query = useAdminFeeVerificationRows(kind, isOpen);

  const columns = useMemo(() => buildFeeVerificationColumns(kind), [kind]);

  return (
    <HealthDetailPanel
      isOpen={isOpen}
      query={query}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyChildren={
        kind === 'pending' ? 'No batch fees waiting for verification' : 'No failed batch fee checks in the last 7 days'
      }
    />
  );
};

export default FeeVerificationPanel;
