'use client';

import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import CollapsibleCard from 'components/common/CollapsibleCard';
import type { ChainAllowanceData } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { isNullish } from 'lib/utils';
import type { Erc721SingleAllowance, OnUpdate, TokenAllowanceData } from 'lib/utils/allowances';
import { useEffect, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
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

  const [isExpanded, setIsExpanded] = useState(() => {
    if (!isNullish(defaultExpanded)) return defaultExpanded;
    return status === 'success' && allowances.length > 0;
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - only auto-expand on status change
  useEffect(() => {
    if (status === 'success' && allowances.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [status, allowances.length]);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const data = useMemo(() => allowances, [allowances]);

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

  const canExpand = status === 'success' && allowances.length > 0;
  const toggleExpanded = () => canExpand && setIsExpanded(!isExpanded);

  return (
    <CollapsibleCard
      isExpanded={isExpanded}
      canExpand={canExpand}
      onToggle={toggleExpanded}
      className={twMerge(
        chainData.status === 'error'
          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
          : 'border-black dark:border-white bg-white dark:bg-black',
      )}
      headerClassName={twMerge(canExpand && 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50')}
      contentClassName="border-black dark:border-white bg-zinc-50 dark:bg-zinc-900"
      header={<ChainSectionHeader chainData={chainData} />}
    >
      <Table table={table} loading={false} error={null} emptyChildren={null} className="border-none" />
    </CollapsibleCard>
  );
};

export default ChainAllowanceSection;
