import { type Row, type RowData, createColumnHelper } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import LastUpdatedCell from 'components/allowances/dashboard/cells/LastUpdatedCell';
import type { Address } from 'viem';
import EventTypeCell from './cells/EventTypeCell';
import HistoryAmountCell from './cells/HistoryAmountCell';
import HistoryAssetCell from './cells/HistoryAssetCell';
import HistorySpenderCell from './cells/HistorySpenderCell';
import type { ApprovalHistoryEvent } from './utils';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onFilter: (filterValue: string) => void;
  }
}

export enum ColumnId {
  ASSET = 'Asset',
  EVENT_TYPE = 'Event Type',
  SPENDER = 'Approved Spender',
  AMOUNT = 'Amount',
  DATE = 'Date',
  COMBINED_SEARCH = 'Combined Search',
}

// Custom filter functions for history table
export const customFilterFns = {
  spender: (row: Row<ApprovalHistoryEvent>, columnId: string, filterValues: string[]) => {
    const spenderAddress = row.original.payload.spender;
    return filterValues.some((value) => spenderAddress.toLowerCase().includes(value.toLowerCase()));
  },
  token: (row: Row<ApprovalHistoryEvent>, columnId: string, filterValues: string[]) => {
    const tokenAddress = row.original.token;
    const metadata = 'metadata' in row.original ? row.original.metadata : undefined;
    const tokenSymbol = metadata && typeof metadata === 'object' && 'symbol' in metadata ? String(metadata.symbol) : '';
    const tokenName = metadata && typeof metadata === 'object' && 'name' in metadata ? String(metadata.name) : '';

    return filterValues.some((value) => {
      const searchTerm = value.toLowerCase();
      return (
        tokenAddress?.toLowerCase().includes(searchTerm) ||
        tokenSymbol.toLowerCase().includes(searchTerm) ||
        tokenName.toLowerCase().includes(searchTerm)
      );
    });
  },
  // Combined filter for searching both spenders and tokens with OR logic
  combined: (
    row: Row<ApprovalHistoryEvent>,
    columnId: string,
    filterData: { spenderTerms: string[]; tokenTerms: string[] },
  ) => {
    const spenderAddress = row.original.payload.spender;
    const tokenAddress = row.original.token;
    const metadata = 'metadata' in row.original ? row.original.metadata : undefined;
    const tokenSymbol = metadata && typeof metadata === 'object' && 'symbol' in metadata ? String(metadata.symbol) : '';
    const tokenName = metadata && typeof metadata === 'object' && 'name' in metadata ? String(metadata.name) : '';

    // Check spender matches
    const spenderMatches = filterData.spenderTerms.some((value) =>
      spenderAddress.toLowerCase().includes(value.toLowerCase()),
    );

    // Check token matches
    const tokenMatches = filterData.tokenTerms.some((value) => {
      const searchTerm = value.toLowerCase();
      return (
        tokenAddress?.toLowerCase().includes(searchTerm) ||
        tokenSymbol.toLowerCase().includes(searchTerm) ||
        tokenName.toLowerCase().includes(searchTerm)
      );
    });

    return spenderMatches || tokenMatches;
  },
};

const columnHelper = createColumnHelper<ApprovalHistoryEvent>();
export const columns = [
  // Virtual column for combined search (not displayed)
  columnHelper.display({
    id: ColumnId.COMBINED_SEARCH,
    enableColumnFilter: true,
    filterFn: customFilterFns.combined,
  }),

  columnHelper.accessor('token', {
    id: ColumnId.ASSET,
    header: () => <HeaderCell i18nKey="address.headers.asset" />,
    cell: (info) => <HistoryAssetCell event={info.row.original} onFilter={info.table.options.meta!.onFilter} />,
    size: 160,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.token,
  }),

  columnHelper.accessor('payload.spender', {
    id: ColumnId.SPENDER,
    header: () => <HeaderCell i18nKey="address.headers.spender" />,
    cell: (info) => (
      <HistorySpenderCell
        address={
          'oldSpender' in info.row.original.payload
            ? (info.row.original.payload.oldSpender as Address)
            : info.row.original.payload.spender
        }
        chainId={info.row.original.chainId}
        onFilter={info.table.options.meta!.onFilter}
      />
    ),
    size: 160,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.spender,
  }),

  columnHelper.accessor('type', {
    id: ColumnId.EVENT_TYPE,
    header: () => <HeaderCell i18nKey="address.headers.event_type" />,
    cell: ({ row }) => <EventTypeCell approvalEvent={row.original} />,
    size: 96,
    enableSorting: false,
  }),

  columnHelper.accessor('payload.amount', {
    id: ColumnId.AMOUNT,
    header: () => <HeaderCell i18nKey="address.headers.amount" />,
    cell: ({ row }) => <HistoryAmountCell event={row.original} />,
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
];
