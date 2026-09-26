import { getHistoryEventSpenderAddress } from '@revoke.cash/core/allowances/history';
import { getChainName } from '@revoke.cash/core/chains';
import {
  type EnrichedTokenEvent,
  isCancelPermitEvent,
  isRevokeEvent,
  isTransferTokenEvent,
  TokenEventType,
} from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { createColumnHelper, filterFns, type ReactTable, type Row, sortFns } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import TransactionDateCell from 'components/allowances/dashboard/cells/TransactionDateCell';
import { createTableFeatures } from 'lib/utils/table';
import EventTypeCell from './cells/EventTypeCell';
import HistoryAmountCell from './cells/HistoryAmountCell';
import HistoryAssetCell from './cells/HistoryAssetCell';
import HistoryChainCell from './cells/HistoryChainCell';
import HistorySpenderCell from './cells/HistorySpenderCell';

export interface HistoryTableMeta {
  onFilter: (filterValue: string) => void;
}

export const historyTableFeatures = createTableFeatures<HistoryTableMeta>();
export type HistoryTableFeatures = typeof historyTableFeatures;
export type HistoryRow = Row<HistoryTableFeatures, EnrichedTokenEvent>;
export type HistoryReactTable = ReactTable<HistoryTableFeatures, EnrichedTokenEvent>;

export enum ColumnId {
  CHAIN = 'Network',
  ASSET = 'Asset',
  EVENT_TYPE = 'Event Type',
  SPENDER = 'Approved Spender',
  AMOUNT = 'Amount',
  DATE = 'Date',
  COMBINED_SEARCH = 'Combined Search',
}

// Semantic event categories as displayed by EventTypeCell, used as `event:` search terms.
export type HistoryEventCategory = 'approval' | 'revocation' | 'cancellation' | 'transfer';

export const getHistoryEventCategory = (event: EnrichedTokenEvent): HistoryEventCategory => {
  if (isTransferTokenEvent(event)) return 'transfer';
  if (isCancelPermitEvent(event)) return 'cancellation';
  if (isRevokeEvent(event)) return 'revocation';
  return 'approval';
};

// A chain term is the text after "chain:" in the search box: a full chain name or an exact chain id
export const matchesChainTerm = (chainId: number, chainTerm: string): boolean => {
  const term = chainTerm.trim().toLowerCase();
  return getChainName(chainId).toLowerCase() === term || chainId.toString() === term;
};

const accessors = {
  token: (event: EnrichedTokenEvent) => {
    if (isNullish(event.metadata?.symbol)) return event.token;
    return `${event.metadata?.symbol} ${event.token}`;
  },
  spender: (event: EnrichedTokenEvent) => {
    const spenderAddress = getHistoryEventSpenderAddress(event);
    if (isNullish(event.payload.spenderData?.name)) return spenderAddress;
    return `${event.payload.spenderData?.name} ${spenderAddress}`;
  },
  timestamp: (event: EnrichedTokenEvent) => {
    return event.time.timestamp;
  },
};

// Custom filter functions for history table
export const customFilterFns = {
  includesOneOfStrings: (row: HistoryRow, columnId: string, filterValues: string[]) => {
    const results = filterValues.map((filterValue) => {
      return filterFns.includesString(row, columnId, filterValue.toLowerCase(), () => {});
    });

    return results.some((result) => result);
  },
  matchesOneOfChainTerms: (row: HistoryRow, _columnId: string, filterValues: string[]) => {
    return filterValues.some((chainTerm) => matchesChainTerm(row.original.chainId, chainTerm));
  },
  tokenOrSpender: (row: HistoryRow, _columnId: string, filterValues: string[]) => {
    const spenderMatches = customFilterFns.includesOneOfStrings(row, ColumnId.SPENDER, filterValues);
    const tokenMatches = customFilterFns.includesOneOfStrings(row, ColumnId.ASSET, filterValues);
    return spenderMatches || tokenMatches;
  },
};

const columnHelper = createColumnHelper<HistoryTableFeatures, EnrichedTokenEvent>();
export const columns = columnHelper.columns([
  // Virtual column for combined search (not displayed)
  columnHelper.display({
    id: ColumnId.COMBINED_SEARCH,
    enableColumnFilter: true,
    filterFn: customFilterFns.tokenOrSpender,
  }),
  columnHelper.accessor('chainId', {
    id: ColumnId.CHAIN,
    header: () => <HeaderCell i18nKey="address.headers.chain" />,
    cell: ({ row }) => <HistoryChainCell chainId={row.original.chainId} />,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.matchesOneOfChainTerms,
  }),
  columnHelper.accessor(accessors.token, {
    id: ColumnId.ASSET,
    header: () => <HeaderCell i18nKey="address.headers.asset" />,
    cell: (info) => <HistoryAssetCell event={info.row.original} onFilter={info.table.options.meta!.onFilter} />,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.includesOneOfStrings,
  }),
  columnHelper.accessor(getHistoryEventCategory, {
    id: ColumnId.EVENT_TYPE,
    header: () => <HeaderCell i18nKey="address.headers.event_type" />,
    cell: ({ row }) => <EventTypeCell event={row.original} />,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.includesOneOfStrings,
  }),
  columnHelper.accessor(accessors.spender, {
    id: ColumnId.SPENDER,
    header: () => <HeaderCell i18nKey="address.headers.spender" />,
    cell: (info) => {
      const event = info.row.original;
      const spenderAddress = getHistoryEventSpenderAddress(event);
      const permit2Address =
        isTransferTokenEvent(event) || event.type === TokenEventType.PERMIT2 ? event.payload.permit2Address : undefined;

      return (
        <HistorySpenderCell
          address={spenderAddress}
          spenderData={event.payload.spenderData}
          permit2Address={permit2Address}
          chainId={event.chainId}
          onFilter={info.table.options.meta!.onFilter}
        />
      );
    },
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.includesOneOfStrings,
  }),
  columnHelper.accessor('payload.amount', {
    id: ColumnId.AMOUNT,
    header: () => <HeaderCell i18nKey="address.headers.amount" />,
    cell: ({ row }) => <HistoryAmountCell event={row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor(accessors.timestamp, {
    id: ColumnId.DATE,
    header: () => <HeaderCell i18nKey="address.headers.date" />,
    cell: ({ row }) => <TransactionDateCell timeLog={row.original.time} chainId={row.original.chainId} />,
    enableSorting: true,
    sortFn: sortFns.basic,
  }),
]);
