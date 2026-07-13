import type { SubscriptionPayment } from '@revoke.cash/core/premium/types';
import { createColumnHelper } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';

export enum ColumnId {
  DATE = 'Date',
  PLAN = 'Plan',
  AMOUNT = 'Amount',
  TRANSACTION = 'Transaction',
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
];
