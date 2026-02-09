'use client';

import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import type { ChainAllowanceData } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { isNullish } from 'lib/utils';
import type { Erc721SingleAllowance, OnUpdate, TokenAllowanceData } from 'lib/utils/allowances';
import { useEffect, useMemo, useState } from 'react';
import Table from '../../common/table/Table';
import ChainSectionHeader from './ChainSectionHeader';
import { ColumnId, columns } from './columns';

interface Props {
  chainData: ChainAllowanceData;
  onUpdate: OnUpdate;
  defaultExpanded?: boolean;
}

const getRowId = (row: TokenAllowanceData) => {
  return `${row.chainId}-${row.contract.address}-${row.payload?.spender}-${(row.payload as Erc721SingleAllowance)?.tokenId}`;
};

const ChainAllowanceSection = ({ chainData, onUpdate, defaultExpanded }: Props) => {
  const { status, allowances } = chainData;

  // Expand by default if there are allowances, collapse if empty or loading
  const [isExpanded, setIsExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    return status === 'success' && allowances.length > 0;
  });

  // Auto-expand when loading completes and there are allowances
  // We intentionally omit isExpanded from deps - we only want to trigger on status/allowances changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - only auto-expand on status change
  useEffect(() => {
    if (status === 'success' && allowances.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [status, allowances.length]);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Memoize data to prevent infinite re-renders
  const data = useMemo(() => allowances, [allowances]);

  // Sync row selection with data changes
  useEffect(() => {
    setRowSelection((currentSelection) => {
      if (!data || data.length === 0) return {};
      if (Object.keys(currentSelection).length === 0) return {};

      return data.reduce<Record<string, boolean>>((acc, allowance) => {
        if (currentSelection[getRowId(allowance)]) acc[getRowId(allowance)] = true;
        return acc;
      }, {});
    });
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: (row) => !isNullish(row.original.payload) && isNullish(row.original.payload?.revokeError),
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel<TokenAllowanceData>(),
    getSortedRowModel: getSortedRowModel<TokenAllowanceData>(),
    getFilteredRowModel: getFilteredRowModel<TokenAllowanceData>(),
    getRowId,
    meta: { onUpdate } as any,
    initialState: {
      sorting: [{ id: ColumnId.LAST_UPDATED, desc: true }],
      columnVisibility: {
        [ColumnId.BALANCE]: false,
      },
    },
  });

  // Only expandable when loaded with allowances
  const canExpand = status === 'success' && allowances.length > 0;
  const toggleExpanded = () => canExpand && setIsExpanded(!isExpanded);

  return (
    <div className="flex flex-col">
      <ChainSectionHeader
        chainData={chainData}
        isExpanded={isExpanded}
        canExpand={canExpand}
        onToggle={toggleExpanded}
      />

      {isExpanded && status === 'success' && allowances.length > 0 && (
        <div className="border border-black dark:border-white rounded-b-lg overflow-hidden">
          <Table table={table} loading={false} error={null} emptyChildren={null} className="border-none" />
        </div>
      )}
    </div>
  );
};

export default ChainAllowanceSection;
