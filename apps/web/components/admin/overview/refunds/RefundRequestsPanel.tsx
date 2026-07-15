'use client';

import type { PendingRefundRequest } from '@revoke.cash/core/premium/refunds';
import { formatFiatAmount, formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { DAY, formatDateNormalised } from '@revoke.cash/core/utils/time';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import ChainDisplay from 'components/common/ChainDisplay';
import Href from 'components/common/Href';
import Table from 'components/common/table/Table';
import { useAdminRefunds } from 'lib/hooks/admin/useAdminRefunds';
import { useTable } from 'lib/hooks/useTable';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import RefundActionsCell from './RefundActionsCell';
import RefundStateCell from './RefundStateCell';

interface Props {
  isOpen: boolean;
}

// Refunds are legally due within 14 days of the request, so deadlines this close need action
const DEADLINE_WARNING_WINDOW = 7 * DAY;

const columnHelper = createColumnHelper<PendingRefundRequest>();

const columns = [
  columnHelper.accessor('payment.ownerAddress', {
    id: 'owner',
    header: 'Owner',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm flex flex-col gap-0.5">
        <AdminAddressLink address={info.getValue()} />
        {info.row.original.payment.subscriptionId && (
          <Href
            href={`/admin/subscriptions/${info.row.original.payment.subscriptionId}`}
            router
            underline="always"
            className="text-xs text-zinc-500"
          >
            View subscription
          </Href>
        )}
      </div>
    ),
  }),
  columnHelper.accessor('payment.chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <ChainDisplay chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('payment.amountUsdCents', {
    id: 'paid',
    header: 'Paid',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        {formatUsdCents(info.getValue())}{' '}
        <span className="text-zinc-500">({info.row.original.payment.tokenSymbol})</span>
      </div>
    ),
  }),
  columnHelper.accessor('refundAmountUsdCents', {
    id: 'refund',
    header: 'Refund',
    cell: (info) => <div className="py-1.5 pr-4 text-sm">{formatUsdCents(info.getValue())}</div>,
  }),
  columnHelper.accessor('requestedAt', {
    id: 'requested',
    header: 'Requested',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm text-zinc-600 dark:text-zinc-400 font-monosans">
        {formatDateNormalised(new Date(info.getValue()))}
      </div>
    ),
  }),
  columnHelper.accessor('refundDeadlineAt', {
    id: 'deadline',
    header: 'Deadline',
    cell: (info) => {
      const deadlineIsClose = new Date(info.getValue()).getTime() - Date.now() < DEADLINE_WARNING_WINDOW;
      return (
        <div
          className={twMerge(
            'py-1.5 pr-4 text-sm text-zinc-600 dark:text-zinc-400 font-monosans',
            deadlineIsClose && 'text-red-600 dark:text-red-400 font-medium',
          )}
        >
          {formatDateNormalised(new Date(info.getValue()))}
        </div>
      );
    },
  }),
  columnHelper.accessor('consumption', {
    id: 'consumption',
    header: 'Consumption',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm text-zinc-600 dark:text-zinc-400">
        {formatFiatAmount(info.getValue().autoRevokeGasUsd)} gas · {info.getValue().waivedBatchRevokeCount} waived fees
      </div>
    ),
  }),
  columnHelper.display({
    id: 'state',
    header: 'State',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <RefundStateCell request={info.row.original} />
      </div>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => null,
    cell: (info) => <RefundActionsCell request={info.row.original} />,
  }),
];

const RefundRequestsPanel = ({ isOpen }: Props) => {
  const { data, isLoading, error } = useAdminRefunds(isOpen);

  const rows = useMemo(() => data ?? [], [data]);

  const table = useTable({ data: rows, columns, getRowId: (row) => row.id });

  if (!isOpen) return null;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="No pending refund requests"
        className="border-none"
      />
    </div>
  );
};

export default RefundRequestsPanel;
