import { createColumnHelper, Row, RowData, sortingFns } from '@tanstack/react-table';
import { AllowanceData } from 'lib/interfaces';
import { toFloat } from 'lib/utils';
import { formatErc20Allowance } from 'lib/utils/allowances';
import { isErc721Contract } from 'lib/utils/tokens';
import AllowanceCell from './cells/AllowanceCell';
import AssetCell from './cells/AssetCell';
import AssetTypeCell from './cells/AssetTypeCell';
import ControlsCell from './cells/ControlsCell';
import HeaderCell from './cells/HeaderCell';
import LastUpdatedCell from './cells/LastUpdatedCell';
import SpenderCell from './cells/SpenderCell';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onUpdate: (allowance: AllowanceData, newAmount?: string) => void;
  }
}

export enum ColumnId {
  SYMBOL = 'Asset Name',
  ASSET_TYPE = 'Asset Type',
  BALANCE = 'Balance',
  ALLOWANCE = 'Allowance',
  SPENDER = 'Approved Spender',
  LAST_UPDATED = 'Last Updated',
  ACTIONS = 'Actions',
}

export const accessors = {
  allowance: (allowance: AllowanceData) => {
    if (!allowance.spender) return undefined;

    if (allowance.amount) {
      return formatErc20Allowance(allowance.amount, allowance.decimals, allowance.totalSupply);
    }

    return allowance.tokenId ?? 'Unlimited';
  },
  balance: (allowance: AllowanceData) => {
    return toFloat(allowance.balance, allowance.decimals);
  },
  assetType: (allowance: AllowanceData) => {
    if (isErc721Contract(allowance.contract)) return 'NFT';
    return 'Token';
  },
};

export const customSortingFns = {
  timestamp: (rowA: Row<AllowanceData>, rowB: Row<AllowanceData>, columnId: string) => {
    return sortingFns.basic(rowA, rowB, columnId);
  },
  allowance: (rowA: Row<AllowanceData>, rowB: Row<AllowanceData>, columnId: string) => {
    if (rowA.getValue(columnId) === rowB.getValue(columnId)) return 0;
    if (rowA.getValue(columnId) === 'Unlimited') return 1;
    if (rowB.getValue(columnId) === 'Unlimited') return -1;
    return sortingFns.alphanumeric(rowA, rowB, columnId);
  },
};

export const customFilterFns = {
  assetType: (row: Row<AllowanceData>, columnId: string, filterValues: string[]) => {
    const results = filterValues.map((filterValue) => {
      return row.getValue(columnId) === filterValue;
    });

    return results.some((result) => result);
  },
  balance: (row: Row<AllowanceData>, columnId: string, filterValues: string[]) => {
    const results = filterValues.map((filterValue) => {
      if (filterValue === 'Zero') return row.getValue(columnId) === '0';
      if (filterValue === 'Non-Zero') return row.getValue(columnId) !== '0';
    });

    return results.some((result) => result);
  },
  allowance: (row: Row<AllowanceData>, columnId: string, filterValues: string[]) => {
    const results = filterValues.map((filterValue) => {
      if (filterValue === 'Unlimited') return row.getValue(columnId) === 'Unlimited';
      if (filterValue === 'None') return row.getValue(columnId) === undefined;
      if (filterValue === 'Limited')
        return row.getValue(columnId) !== 'Unlimited' && row.getValue(columnId) !== undefined;
      return true;
    });

    return results.some((result) => result);
  },
};

const columnHelper = createColumnHelper<AllowanceData>();
export const columns = [
  columnHelper.accessor('symbol', {
    id: ColumnId.SYMBOL,
    header: () => <HeaderCell i18nKey="address:headers.asset" />,
    cell: (info) => <AssetCell allowance={info.row.original} />,
    enableSorting: true,
    sortingFn: sortingFns.text,
  }),
  columnHelper.accessor(accessors.assetType, {
    id: ColumnId.ASSET_TYPE,
    header: () => <HeaderCell i18nKey="address:headers.asset_type" />,
    cell: (info) => <AssetTypeCell assetType={info.getValue()} />,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.assetType,
  }),
  columnHelper.accessor(accessors.balance, {
    id: ColumnId.BALANCE,
    enableHiding: true,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.balance,
  }),
  columnHelper.accessor(accessors.allowance, {
    id: ColumnId.ALLOWANCE,
    header: () => <HeaderCell i18nKey="address:headers.allowance" />,
    cell: (info) => <AllowanceCell allowance={info.row.original} onUpdate={info.table.options.meta.onUpdate} />,
    enableSorting: true,
    sortingFn: customSortingFns.allowance,
    sortUndefined: 1,
    enableColumnFilter: true,
    filterFn: customFilterFns.allowance,
  }),
  columnHelper.accessor('spender', {
    id: ColumnId.SPENDER,
    header: () => <HeaderCell i18nKey="address:headers.spender" />,
    cell: (info) => <SpenderCell allowance={info.row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor('lastUpdated', {
    id: ColumnId.LAST_UPDATED,
    header: () => <HeaderCell i18nKey="address:headers.last_updated" />,
    cell: (info) => <LastUpdatedCell allowance={info.row.original} />,
    enableSorting: true,
    sortingFn: customSortingFns.timestamp,
    sortUndefined: 1,
  }),
  columnHelper.display({
    id: ColumnId.ACTIONS,
    header: () => <HeaderCell i18nKey="address:headers.actions" align="right" />,
    cell: (info) => <ControlsCell allowance={info.row.original} onUpdate={info.table.options.meta.onUpdate} />,
  }),
];
