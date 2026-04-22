import { createColumnHelper, type RowData } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import type { Marketplace, OnCancel } from 'lib/interfaces';
import CancelMarketplaceCell from '../cells/CancelMarketplaceCell';
import LastCancelledCell from '../cells/LastCancelledCell';
import MarketplaceCell from '../cells/MarketplaceCell';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onCancel: OnCancel<TData>;
  }
}

export enum ColumnId {
  MARKETPLACE = 'Marketplace',
  LAST_DELISTED = 'Last Delisted',
  ACTIONS = 'Actions',
}

const columnHelper = createColumnHelper<Marketplace>();
export const columns = [
  columnHelper.accessor('name', {
    id: ColumnId.MARKETPLACE,
    header: () => <HeaderCell i18nKey="signatures.marketplace.table.headers.marketplace" />,
    cell: (info) => <MarketplaceCell marketplace={info.row.original} />,
  }),
  columnHelper.accessor('lastCancelled', {
    id: ColumnId.LAST_DELISTED,
    header: () => <HeaderCell i18nKey="signatures.marketplace.table.headers.last_delisted" />,
    cell: (info) => (
      <LastCancelledCell chainId={info.row.original.chainId} lastCancelled={info.row.original.lastCancelled} />
    ),
  }),
  columnHelper.display({
    id: ColumnId.ACTIONS,
    header: () => <HeaderCell i18nKey="signatures.marketplace.table.headers.actions" align="right" />,
    cell: (info) => (
      <CancelMarketplaceCell marketplace={info.row.original} onCancel={info.table.options.meta!.onCancel} />
    ),
  }),
];
