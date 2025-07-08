import { createColumnHelper } from '@tanstack/react-table';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import LastUpdatedCell from 'components/allowances/dashboard/cells/LastUpdatedCell';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import type { ApprovalTokenEvent } from 'lib/utils/events';
import { TokenEventType } from 'lib/utils/events';
import { formatUnits } from 'viem';
import EventTypeCell from './cells/EventTypeCell';
import HistoryAssetCell from './cells/HistoryAssetCell';

const columnHelper = createColumnHelper<ApprovalTokenEvent>();

export enum ColumnId {
  ASSET = 'Asset',
  EVENT_TYPE = 'Event Type',
  SPENDER = 'Approved Spender',
  AMOUNT = 'Amount',
  DATE = 'Date',
  TRANSACTION = 'Transaction',
}

export const columns = [
  columnHelper.accessor('token', {
    id: ColumnId.ASSET,
    header: () => <HeaderCell i18nKey="address.headers.asset" />,
    cell: ({ row }) => <HistoryAssetCell event={row.original} />,
    size: 160,
    enableSorting: false,
  }),

  columnHelper.accessor('type', {
    id: ColumnId.EVENT_TYPE,
    header: () => <HeaderCell i18nKey="address.headers.event_type" />,
    cell: ({ row }) => <EventTypeCell approvalEvent={row.original} />,
    size: 96,
    enableSorting: false,
  }),

  columnHelper.accessor('payload.spender', {
    id: ColumnId.SPENDER,
    header: () => <HeaderCell i18nKey="address.headers.spender" />,
    cell: ({ row }) => <AddressCell address={row.original.payload.spender} chainId={row.original.chainId} />,
    size: 160,
    enableSorting: false,
  }),

  columnHelper.accessor('payload.amount', {
    id: ColumnId.AMOUNT,
    header: () => <HeaderCell i18nKey="address.headers.amount" />,
    cell: ({ row }) => {
      const { type, payload } = row.original;
      const metadata = 'metadata' in row.original ? row.original.metadata : undefined;

      if (type === TokenEventType.APPROVAL_FOR_ALL) {
        return payload.approved ? 'All NFTs' : 'None';
      }

      if (type === TokenEventType.APPROVAL_ERC721) {
        return `Token #${payload.tokenId}`;
      }

      if ('amount' in payload && payload.amount === 0n) {
        return '0';
      }

      if ('amount' in payload && payload.amount > 10n ** 50n) {
        return 'Unlimited';
      }

      const decimals = metadata && typeof metadata === 'object' && 'decimals' in metadata ? metadata.decimals : 18;
      return 'amount' in payload ? formatUnits(payload.amount, decimals as number) : '';
    },
    size: 128,
    enableSorting: false,
  }),

  columnHelper.accessor('time.timestamp', {
    id: ColumnId.DATE,
    header: () => <HeaderCell i18nKey="address.headers.date" />,
    cell: ({ row }) => <LastUpdatedCell lastUpdated={row.original.time} chainId={row.original.chainId} />,
    size: 128,
    enableSorting: true,
    sortingFn: 'basic',
  }),

  columnHelper.accessor('time.transactionHash', {
    id: ColumnId.TRANSACTION,
    header: () => <HeaderCell i18nKey="address.headers.transaction" />,
    cell: ({ row }) => (
      <TransactionHashCell transactionHash={row.original.time.transactionHash} chainId={row.original.chainId} />
    ),
    size: 128,
    enableSorting: false,
  }),
];
