import { createColumnHelper, RowData } from '@tanstack/react-table';
import AssetCell from 'components/allowances/dashboard/cells/AssetCell';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import { AllowanceData, OnCancel, PermitTokenData } from 'lib/interfaces';
import { formatFixedPointBigInt } from 'lib/utils/formatting';
import CancelPermitCell from '../cells/CancelPermitCell';
import LastCancelledCell from '../cells/LastCancelledCell';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onCancel: OnCancel<TData>;
  }
}

export enum ColumnId {
  SYMBOL = 'Asset Name',
  BALANCE = 'Balance',
  LAST_CANCELLED = 'Last Cancelled',
  ACTIONS = 'Actions',
}

export const accessors = {
  balance: (allowance: AllowanceData) => {
    return allowance.balance === 'ERC1155'
      ? 'ERC1155'
      : formatFixedPointBigInt(allowance.balance, allowance.metadata.decimals);
  },
};

const columnHelper = createColumnHelper<PermitTokenData>();
export const columns = [
  columnHelper.accessor('metadata.symbol', {
    id: ColumnId.SYMBOL,
    header: () => <HeaderCell i18nKey="address.headers.asset" />,
    cell: (info) => <AssetCell asset={info.row.original} />,
  }),
  columnHelper.accessor(accessors.balance, {
    id: ColumnId.BALANCE,
    enableHiding: true,
  }),
  columnHelper.accessor('lastCancelled', {
    id: ColumnId.LAST_CANCELLED,
    header: () => <HeaderCell i18nKey="address.headers.last_cancelled" />,
    cell: (info) => (
      <LastCancelledCell chainId={info.row.original.chainId} lastCancelled={info.row.original.lastCancelled} />
    ),
  }),
  columnHelper.display({
    id: ColumnId.ACTIONS,
    header: () => <HeaderCell i18nKey="address.headers.actions" align="right" />,
    cell: (info) => <CancelPermitCell token={info.row.original} onCancel={info.table.options.meta.onCancel} />,
  }),
];
