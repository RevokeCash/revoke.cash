import { createColumnHelper, filterFns, Row, RowData, sortingFns } from '@tanstack/react-table';
import { AllowanceData, OnUpdate } from 'lib/interfaces';
import { calculateValueAtRisk, isNullish } from 'lib/utils';
import { formatErc20Allowance } from 'lib/utils/allowances';
import { formatFixedPointBigInt } from 'lib/utils/formatting';
import { isErc721Contract } from 'lib/utils/tokens';
import AllowanceCell from './cells/AllowanceCell';
import AssetCell from './cells/AssetCell';
import AssetTypeCell from './cells/AssetTypeCell';
import ControlsCell from './cells/ControlsCell';
import HeaderCell from './cells/HeaderCell';
import LastUpdatedCell from './cells/LastUpdatedCell';
import SpenderCell from './cells/SpenderCell';
import ValueAtRiskCell from './cells/ValueAtRiskCell';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onUpdate: OnUpdate;
  }
}

export enum ColumnId {
  SYMBOL = 'Asset Name',
  ASSET_TYPE = 'Asset Type',
  BALANCE = 'Balance',
  ALLOWANCE = 'Allowance',
  VALUE_AT_RISK = 'Value at Risk',
  SPENDER = 'Approved Spender',
  LAST_UPDATED = 'Last Updated',
  ACTIONS = 'Actions',
}

export const accessors = {
  allowance: (allowance: AllowanceData) => {
    if (!allowance.spender) return undefined;

    if (allowance.amount) {
      return formatErc20Allowance(allowance.amount, allowance.metadata.decimals, allowance.metadata.totalSupply);
    }

    return allowance.tokenId ?? 'Unlimited';
  },
  balance: (allowance: AllowanceData) => {
    return allowance.balance === 'ERC1155'
      ? 'ERC1155'
      : formatFixedPointBigInt(allowance.balance, allowance.metadata.decimals);
  },
  assetType: (allowance: AllowanceData) => {
    if (isErc721Contract(allowance.contract)) return 'NFT';
    return 'Token';
  },
  valueAtRisk: (allowance: AllowanceData) => {
    // No approvals should be sorted separately through `sortUndefined`
    if (!allowance.spender) return undefined;

    // No balance means no risk (even if we don't know the price)
    if (allowance.balance === 0n) return 0;

    // If we don't know the price, we can't calculate the value at risk, but we want to it to be sorted
    // before "no approvals" and before the < $0.01 threshold
    if (allowance.balance === 'ERC1155') return 0.01;
    if (isNullish(allowance.metadata.price)) return 0.01;

    return calculateValueAtRisk(allowance);
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
  spender: (row: Row<AllowanceData>, columnId: string, filterValues: string[]) => {
    const results = filterValues.map((filterValue) => {
      return filterFns.includesString(row, columnId, filterValue, () => {});
    });

    return results.some((result) => result);
  },
};

const columnHelper = createColumnHelper<AllowanceData>();
export const columns = [
  columnHelper.accessor('metadata.symbol', {
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
  columnHelper.accessor(accessors.valueAtRisk, {
    id: ColumnId.VALUE_AT_RISK,
    header: () => <HeaderCell i18nKey="address:headers.value_at_risk" align="left" />,
    cell: (info) => <ValueAtRiskCell allowance={info.row.original} />,
    enableSorting: true,
    sortingFn: sortingFns.basic,
    sortUndefined: 1,
  }),
  columnHelper.accessor('spender', {
    id: ColumnId.SPENDER,
    header: () => <HeaderCell i18nKey="address:headers.spender" />,
    cell: (info) => <SpenderCell allowance={info.row.original} />,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: customFilterFns.spender,
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
