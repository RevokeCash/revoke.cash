'use client';

import { type Row, type RowData, createColumnHelper, filterFns, sortingFns } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
import ContractCell from './cells/ContractCell';
import ControlsCell from './cells/ControlsCell';
import DelegateCell from './cells/DelegateCell';
import DelegationTypeCell from './cells/DelegationTypeCell';
import DelegatorCell from './cells/DelegatorCell';
import PlatformCell from './cells/PlatformCell';

export enum ColumnId {
  TYPE = 'Delegation Type',
  DELEGATOR = 'Delegator',
  DELEGATE = 'Delegate',
  CONTRACT = 'Contract',
  PLATFORM = 'Platform',
  CONTROLS = 'Controls',
}

// Simple property accessors - can use strings directly since these are basic property lookups
export const accessors = {
  type: 'type' as const,
  delegator: 'delegator' as const,
  delegate: 'delegate' as const,
  contract: 'contract' as const,
  platform: 'platform' as const,
};

// sorting functions
export const customSortingFns = {
  type: (rowA: Row<Delegation>, rowB: Row<Delegation>, columnId: string) => {
    const typeOrder = {
      WALLET: 1,
      CONTRACT: 2,
      TOKEN: 3,
      ERC721: 4,
      ERC1155: 5,
      NONE: 6,
    };

    const typeA = rowA.getValue(columnId) as string;
    const typeB = rowB.getValue(columnId) as string;

    const orderA = typeOrder[typeA as keyof typeof typeOrder] || 10;
    const orderB = typeOrder[typeB as keyof typeof typeOrder] || 10;

    return orderA - orderB;
  },
};

// Custom filter functions
export const customFilterFns = {
  type: (row: Row<Delegation>, columnId: string, filterValues: string[]) => {
    if (!filterValues.length) return true;
    const results = filterValues.map((filterValue) => row.getValue(columnId) === filterValue);
    return results.some((result) => result);
  },
  platform: (row: Row<Delegation>, columnId: string, filterValues: string[]) => {
    if (!filterValues.length) return true;
    const results = filterValues.map((filterValue) => {
      return filterFns.includesString(row, columnId, filterValue, () => {});
    });
    return results.some((result) => result);
  },
};

// This will extend the original TableMeta interface, not replace it
declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onRevoke?: (delegation: Delegation) => void;
  }
}

const columnHelper = createColumnHelper<Delegation>();

// Function to create columns with translations
const createColumns = (incoming: boolean) => {
  return [
    // Delegator column (specific to incoming)
    ...(incoming
      ? [
          columnHelper.accessor(accessors.delegator, {
            id: ColumnId.DELEGATOR,
            header: () => <HeaderCell i18nKey="address.delegations.columns.delegator" />,
            cell: (info) => <DelegatorCell delegation={info.row.original} />,
            enableSorting: true,
            sortingFn: sortingFns.alphanumeric,
          }),
        ]
      : []),
    // Delegate column (specific to outgoing)
    ...(!incoming
      ? [
          columnHelper.accessor(accessors.delegate, {
            id: ColumnId.DELEGATE,
            header: () => <HeaderCell i18nKey="address.delegations.columns.delegate" />,
            cell: (info) => <DelegateCell delegation={info.row.original} />,
            enableSorting: true,
            sortingFn: sortingFns.alphanumeric,
          }),
        ]
      : []),
    columnHelper.accessor(accessors.contract, {
      id: ColumnId.CONTRACT,
      header: () => <HeaderCell i18nKey="address.delegations.columns.contract" />,
      cell: (info) => <ContractCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: sortingFns.alphanumeric,
    }),
    columnHelper.accessor(accessors.platform, {
      id: ColumnId.PLATFORM,
      header: () => <HeaderCell i18nKey="address.delegations.columns.platform" />,
      cell: (info) => <PlatformCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: sortingFns.alphanumeric,
      enableColumnFilter: true,
      filterFn: customFilterFns.platform,
    }),
    columnHelper.accessor(accessors.type, {
      id: ColumnId.TYPE,
      header: () => <HeaderCell i18nKey="address.delegations.columns.type" />,
      cell: (info) => <DelegationTypeCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: customSortingFns.type,
      enableColumnFilter: true,
      filterFn: customFilterFns.type,
    }),
    columnHelper.display({
      id: ColumnId.CONTROLS,
      header: () => '',
      cell: (info) => {
        // Make sure onRevoke exists before accessing it
        if (!info.table.options.meta?.onRevoke) return <div className="w-28" />;
        return <ControlsCell delegation={info.row.original} onRevoke={info.table.options.meta.onRevoke} />;
      },
    }),
  ];
};

export const outgoingColumns = createColumns(false);
export const incomingColumns = createColumns(true);
