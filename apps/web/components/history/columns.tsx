import { getChainName } from '@revoke.cash/core/chains';
import { type ApprovalTokenEvent, type Enriched, TokenEventType } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { createColumnHelper, filterFns, type Row, type RowData } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import LastUpdatedCell from 'components/allowances/dashboard/cells/LastUpdatedCell';
import EventTypeCell from './cells/EventTypeCell';
import HistoryAmountCell from './cells/HistoryAmountCell';
import HistoryAssetCell from './cells/HistoryAssetCell';
import HistoryChainCell from './cells/HistoryChainCell';
import HistorySpenderCell from './cells/HistorySpenderCell';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onFilter: (filterValue: string) => void;
  }
}

export enum ColumnId {
  CHAIN = 'Network',
  ASSET = 'Asset',
  EVENT_TYPE = 'Event Type',
  SPENDER = 'Approved Spender',
  AMOUNT = 'Amount',
  DATE = 'Date',
  COMBINED_SEARCH = 'Combined Search',
}

const accessors = {
  token: (event: Enriched<ApprovalTokenEvent>) => {
    if (isNullish(event.metadata?.symbol)) return event.token;
    return `${event.metadata?.symbol} ${event.token}`;
  },
  spender: (event: Enriched<ApprovalTokenEvent>) => {
    const spenderAddress =
      event.type === TokenEventType.APPROVAL_ERC721 && event.payload.oldSpender
        ? event.payload.oldSpender
        : event.payload.spender;
    if (isNullish(event.payload.spenderData?.name)) return spenderAddress;
    return `${event.payload.spenderData?.name} ${spenderAddress}`;
  },
  timestamp: (event: Enriched<ApprovalTokenEvent>) => {
    return event.time.timestamp;
  },
  chain: (event: Enriched<ApprovalTokenEvent>) => {
    const chainName = getChainName(event.chainId);
    return `${chainName} ${event.chainId}`;
  },
};

// Custom filter functions for history table
export const customFilterFns = {
  includesOneOfStrings: (row: Row<Enriched<ApprovalTokenEvent>>, columnId: string, filterValues: string[]) => {
    const results = filterValues.map((filterValue) => {
      return filterFns.includesString(row, columnId, filterValue, () => {});
    });

    return results.some((result) => result);
  },
  tokenOrSpender: (row: Row<Enriched<ApprovalTokenEvent>>, _columnId: string, filterValues: string[]) => {
    const spenderMatches = customFilterFns.includesOneOfStrings(row, ColumnId.SPENDER, filterValues);
    const tokenMatches = customFilterFns.includesOneOfStrings(row, ColumnId.ASSET, filterValues);
    return spenderMatches || tokenMatches;
  },
};

const columnHelper = createColumnHelper<Enriched<ApprovalTokenEvent>>();
export const columns = [
  // Virtual column for combined search (not displayed)
  columnHelper.display({
    id: ColumnId.COMBINED_SEARCH,
    enableColumnFilter: true,
    filterFn: customFilterFns.tokenOrSpender,
  }),
  columnHelper.accessor(accessors.chain, {
    id: ColumnId.CHAIN,
    header: () => <HeaderCell i18nKey="address.headers.chain" />,
    cell: ({ row }) => <HistoryChainCell chainId={row.original.chainId} />,
    size: 132,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.includesOneOfStrings,
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
  columnHelper.accessor('type', {
    id: ColumnId.EVENT_TYPE,
    header: () => <HeaderCell i18nKey="address.headers.event_type" />,
    cell: ({ row }) => <EventTypeCell approvalEvent={row.original} />,
    size: 96,
    enableSorting: false,
  }),
  columnHelper.accessor(accessors.spender, {
    id: ColumnId.SPENDER,
    header: () => <HeaderCell i18nKey="address.headers.spender" />,
    cell: (info) => {
      const event = info.row.original;
      const spenderAddress =
        event.type === TokenEventType.APPROVAL_ERC721 && event.payload.oldSpender
          ? event.payload.oldSpender
          : event.payload.spender;

      return (
        <HistorySpenderCell
          address={spenderAddress}
          spenderData={event.payload.spenderData}
          chainId={event.chainId}
          onFilter={info.table.options.meta!.onFilter}
        />
      );
    },
    size: 160,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.includesOneOfStrings,
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
