import { createColumnHelper, filterFns, type Row, type RowData } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import LastUpdatedCell from 'components/allowances/dashboard/cells/LastUpdatedCell';
import { isNullish } from 'lib/utils';
import type { Address } from 'viem';
import EventTypeCell from './cells/EventTypeCell';
import HistoryAmountCell from './cells/HistoryAmountCell';
import HistoryAssetCell from './cells/HistoryAssetCell';
import HistorySpenderCell from './cells/HistorySpenderCell';
import type { ApprovalHistoryEvent } from './utils';

declare module '@tanstack/table-core' {
  // biome-ignore lint/correctness/noUnusedVariables: Because of declaration merging in @tanstack/table-core we can't have multiple custom fields and need to type as any. See https://github.com/TanStack/table/discussions/4220
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

const accessors = {
  token: (event: ApprovalHistoryEvent) => {
    if (isNullish(event.metadata?.symbol)) return event.token;
    return `${event.metadata?.symbol} ${event.token}`;
  },
  spender: (event: ApprovalHistoryEvent) => {
    if (isNullish(event.payload.spenderData?.name)) return event.payload.spender;
    return `${event.payload.spenderData?.name} ${event.payload.spender}`;
  },
  timestamp: (event: ApprovalHistoryEvent) => {
    return event.time.timestamp;
  },
};

// Custom filter functions for history table
export const customFilterFns = {
  includesOneOfStrings: (row: Row<ApprovalHistoryEvent>, columnId: string, filterValues: string[]) => {
    const results = filterValues.map((filterValue) => {
      return filterFns.includesString(row, columnId, filterValue, () => {});
    });

    return results.some((result) => result);
  },
  tokenOrSpender: (row: Row<ApprovalHistoryEvent>, _columnId: string, filterValues: string[]) => {
    const spenderMatches = customFilterFns.includesOneOfStrings(row, ColumnId.SPENDER, filterValues);
    const tokenMatches = customFilterFns.includesOneOfStrings(row, ColumnId.ASSET, filterValues);
    return spenderMatches || tokenMatches;
  },
};

const columnHelper = createColumnHelper<ApprovalHistoryEvent>();
export const columns = [
  // Virtual column for combined search (not displayed)
  columnHelper.display({
    id: ColumnId.COMBINED_SEARCH,
    enableColumnFilter: true,
    filterFn: customFilterFns.tokenOrSpender,
  }),

  columnHelper.accessor(accessors.token, {
    id: ColumnId.ASSET,
    header: () => <HeaderCell i18nKey="address.headers.asset" />,
    cell: (info) => <HistoryAssetCell event={info.row.original} onFilter={info.table.options.meta!.onFilter} />,
    size: 160,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.includesOneOfStrings,
  }),

  columnHelper.accessor(accessors.spender, {
    id: ColumnId.SPENDER,
    header: () => <HeaderCell i18nKey="address.headers.spender" />,
    cell: (info) => (
      <HistorySpenderCell
        address={
          'oldSpender' in info.row.original.payload
            ? (info.row.original.payload.oldSpender as Address)
            : info.row.original.payload.spender
        }
        spenderData={info.row.original.payload.spenderData}
        chainId={info.row.original.chainId}
        onFilter={info.table.options.meta!.onFilter}
      />
    ),
    size: 160,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.includesOneOfStrings,
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

  columnHelper.accessor(accessors.timestamp, {
    id: ColumnId.DATE,
    header: () => <HeaderCell i18nKey="address.headers.date" />,
    cell: ({ row }) => <LastUpdatedCell lastUpdated={row.original.time} chainId={row.original.chainId} />,
    size: 128,
    enableSorting: true,
    sortingFn: 'basic',
  }),
];
