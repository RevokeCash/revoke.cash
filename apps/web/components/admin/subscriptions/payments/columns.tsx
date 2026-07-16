import type { AdminPayment } from '@revoke.cash/core/admin/subscriptions';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { formatDateNormalised } from '@revoke.cash/core/utils/time';
import { createColumnHelper } from '@tanstack/react-table';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import HistoryChainCell from 'components/history/cells/HistoryChainCell';
import PaymentStatusBadge from './PaymentStatusBadge';
import ReconcilePaymentButton from './ReconcilePaymentButton';

const columnHelper = createColumnHelper<AdminPayment>();

export const columns = [
  columnHelper.accessor('createdAt', {
    id: 'date',
    header: 'Date',
    cell: (info) => (
      <span className="text-sm text-zinc-600 dark:text-zinc-400 font-monosans py-3.25 flex">
        {formatDateNormalised(new Date(info.getValue()))}
      </span>
    ),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: (info) => <PaymentStatusBadge status={info.getValue()} chainId={info.row.original.chainId} />,
  }),
  columnHelper.accessor('planName', {
    id: 'plan',
    header: 'Plan',
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  columnHelper.accessor('amountUsdCents', {
    id: 'amount',
    header: 'Amount',
    cell: (info) => (
      <span>
        {formatUsdCents(info.getValue())} <span className="text-zinc-500">({info.row.original.tokenSymbol})</span>
      </span>
    ),
  }),
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => <HistoryChainCell chainId={info.getValue()} />,
  }),
  columnHelper.accessor('txHash', {
    id: 'transaction',
    header: 'Transaction',
    cell: (info) => <TransactionHashCell chainId={info.row.original.chainId} transactionHash={info.getValue()} />,
  }),
  columnHelper.accessor('expiresAt', {
    id: 'expiry',
    header: 'Expiry',
    cell: (info) => (
      <span className="text-sm text-zinc-600 dark:text-zinc-400 font-monosans">
        {formatDateNormalised(new Date(info.getValue()))}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => null,
    cell: (info) => (
      <div className="flex justify-end">
        <ReconcilePaymentButton payment={info.row.original} />
      </div>
    ),
  }),
];
