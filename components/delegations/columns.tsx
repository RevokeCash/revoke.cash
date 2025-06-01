'use client';

import { type Row, type RowData, createColumnHelper, filterFns, sortingFns } from '@tanstack/react-table';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
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

// Accessors for delegation data - these can be used for sorting and filtering
export const accessors = {
  type: (delegation: Delegation) => delegation.type,
  delegator: (delegation: Delegation) => delegation.delegator,
  delegate: (delegation: Delegation) => delegation.delegate,
  contract: (delegation: Delegation) => delegation.contract,
  platform: (delegation: Delegation) => delegation.platform,
};

// sorting functions
export const customSortingFns = {
  type: (rowA: Row<Delegation>, rowB: Row<Delegation>, columnId: string) => {
    const typeOrder = {
      ALL: 1,
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
const createColumns = (t: any, incoming: boolean) => {
  // Common columns for both tables
  const commonColumns = [
    columnHelper.accessor(accessors.type, {
      id: ColumnId.TYPE,
      header: () => t('address.delegations.columns.type'),
      cell: (info) => <DelegationTypeCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: customSortingFns.type,
      enableColumnFilter: true,
      filterFn: customFilterFns.type,
    }),

    // Contract column
    columnHelper.accessor(accessors.contract, {
      id: ColumnId.CONTRACT,
      header: () => t('address.delegations.columns.contract'),
      cell: (info) => <ContractCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: sortingFns.alphanumeric,
    }),

    // Platform column
    columnHelper.accessor(accessors.platform, {
      id: ColumnId.PLATFORM,
      header: () => t('address.delegations.columns.platform'),
      cell: (info) => <PlatformCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: sortingFns.alphanumeric,
      enableColumnFilter: true,
      filterFn: customFilterFns.platform,
    }),
  ];

  if (incoming) {
    // Incoming columns
    return [
      commonColumns[0], // Type

      // Delegator column (specific to incoming)
      columnHelper.accessor(accessors.delegator, {
        id: ColumnId.DELEGATOR,
        header: () => t('address.delegations.columns.delegator'),
        cell: (info) => <DelegatorCell delegation={info.row.original} />,
        enableSorting: true,
        sortingFn: sortingFns.alphanumeric,
      }),

      ...commonColumns.slice(1), // Contract and Platform
    ];
  }

  // Outgoing columns
  return [
    commonColumns[0], // Type

    // Delegate column (specific to outgoing)
    columnHelper.accessor(accessors.delegate, {
      id: ColumnId.DELEGATE,
      header: () => t('address.delegations.columns.delegate'),
      cell: (info) => <DelegateCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: sortingFns.alphanumeric,
    }),

    ...commonColumns.slice(1), // Contract and Platform

    // Controls column (only for outgoing)
    columnHelper.display({
      id: ColumnId.CONTROLS,
      header: () => '',
      cell: (info) => {
        // Make sure onRevoke exists before accessing it
        if (!info.table.options.meta?.onRevoke) return null;
        return <ControlsCell delegation={info.row.original} onRevoke={info.table.options.meta.onRevoke} />;
      },
    }),
  ];
};

const useIncomingColumns = () => {
  const t = useTranslations();
  return useMemo(() => createColumns(t, true), [t]);
};

export const useOutgoingColumns = () => {
  const t = useTranslations();
  return useMemo(() => createColumns(t, false), [t]);
};

// Static columns without translations (for use with direct imports)
const staticColumnHelper = createColumnHelper<Delegation>();

const createStaticColumns = (incoming: boolean) => {
  // Common columns
  const commonColumns = [
    // Type column
    staticColumnHelper.accessor(accessors.type, {
      id: ColumnId.TYPE,
      header: () => <span data-testid="delegation-type-header">Type</span>,
      cell: (info) => <DelegationTypeCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: customSortingFns.type,
      enableColumnFilter: true,
      filterFn: customFilterFns.type,
    }),

    // Contract column
    staticColumnHelper.accessor(accessors.contract, {
      id: ColumnId.CONTRACT,
      header: () => <span data-testid="delegation-contract-header">Contract</span>,
      cell: (info) => <ContractCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: sortingFns.alphanumeric,
    }),

    // Platform column
    staticColumnHelper.accessor(accessors.platform, {
      id: ColumnId.PLATFORM,
      header: () => <span data-testid="delegation-platform-header">Platform</span>,
      cell: (info) => <PlatformCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: sortingFns.alphanumeric,
      enableColumnFilter: true,
      filterFn: customFilterFns.platform,
    }),
  ];

  if (incoming) {
    // Incoming columns
    return [
      commonColumns[0], // Type

      // Delegator column (specific to incoming)
      staticColumnHelper.accessor(accessors.delegator, {
        id: ColumnId.DELEGATOR,
        header: () => <span data-testid="delegation-delegator-header">Delegator</span>,
        cell: (info) => <DelegatorCell delegation={info.row.original} />,
        enableSorting: true,
        sortingFn: sortingFns.alphanumeric,
      }),

      ...commonColumns.slice(1), // Contract and Platform
    ];
  }

  // Outgoing columns
  return [
    commonColumns[0], // Type

    // Delegate column (specific to outgoing)
    staticColumnHelper.accessor(accessors.delegate, {
      id: ColumnId.DELEGATE,
      header: () => <span data-testid="delegation-delegate-header">Delegate</span>,
      cell: (info) => <DelegateCell delegation={info.row.original} />,
      enableSorting: true,
      sortingFn: sortingFns.alphanumeric,
    }),

    ...commonColumns.slice(1), // Contract and Platform

    // Controls column (only for outgoing)
    staticColumnHelper.display({
      id: ColumnId.CONTROLS,
      header: () => <span data-testid="delegation-controls-header" />,
      cell: (info) => {
        // Make sure onRevoke exists before accessing it
        if (!info.table.options.meta?.onRevoke) return null;
        return <ControlsCell delegation={info.row.original} onRevoke={info.table.options.meta.onRevoke} />;
      },
    }),
  ];
};

// Static exports for direct imports
export const incomingColumns = createStaticColumns(true);
export const outgoingColumns = createStaticColumns(false);

// Backward compatibility
export const useColumns = ({ incoming = false }: { incoming?: boolean } = {}) => {
  const t = useTranslations();
  return useMemo(() => createColumns(t, incoming), [t, incoming]);
};

// Alias for backward compatibility
export const useTableColumns = useColumns;
