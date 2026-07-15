import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { SubscriptionPayment } from '@revoke.cash/core/premium/types';
import { createColumnHelper } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import { twMerge } from 'tailwind-merge';
import PaymentStatusCell from './PaymentStatusCell';

export enum ColumnId {
  DATE = 'Date',
  PLAN = 'Plan',
  AMOUNT = 'Amount',
  TRANSACTION = 'Transaction',
  STATUS = 'Status',
  EXPANDER = 'Expander',
}

const columnHelper = createColumnHelper<SubscriptionPayment>();
export const columns = [
  columnHelper.accessor('paidAt', {
    id: ColumnId.DATE,
    header: () => <HeaderCell i18nKey="account.billing.columns.date" />,
    cell: (info) => {
      const paidAt = info.getValue();
      return <div className="py-3 whitespace-nowrap">{paidAt ? new Date(paidAt).toLocaleDateString() : '—'}</div>;
    },
  }),
  columnHelper.accessor('planName', {
    id: ColumnId.PLAN,
    header: () => <HeaderCell i18nKey="account.billing.columns.plan" />,
    cell: (info) => <div className="py-3 whitespace-nowrap">{info.getValue()}</div>,
  }),
  columnHelper.accessor('amountUsdCents', {
    id: ColumnId.AMOUNT,
    header: () => <HeaderCell i18nKey="account.billing.columns.amount" />,
    cell: (info) => (
      <div className="py-3 whitespace-nowrap">
        {info.getValue() / 100} {info.row.original.tokenSymbol}
      </div>
    ),
  }),
  columnHelper.accessor('txHash', {
    id: ColumnId.TRANSACTION,
    header: () => <HeaderCell i18nKey="account.billing.columns.transaction" />,
    cell: (info) => (
      <div className="py-3 whitespace-nowrap">
        <TransactionHashCell chainId={info.row.original.chainId} transactionHash={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.display({
    id: ColumnId.STATUS,
    header: () => <HeaderCell i18nKey="account.billing.columns.status" />,
    cell: (info) => <PaymentStatusCell payment={info.row.original} />,
  }),
  columnHelper.display({
    id: ColumnId.EXPANDER,
    header: () => null,
    cell: ({ row }) =>
      row.getCanExpand() && (
        <div className="flex items-center justify-end py-1.5">
          <ChevronDownIcon className={twMerge('w-4 h-4 duration-150', row.getIsExpanded() && 'rotate-180')} />
        </div>
      ),
  }),
];
