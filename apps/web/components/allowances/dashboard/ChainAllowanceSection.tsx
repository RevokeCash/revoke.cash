'use client';

import type { Erc721SingleAllowance, OnUpdate, TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isNullish } from '@revoke.cash/core/utils';
import { formatFiatAmount } from '@revoke.cash/core/utils/formatting';
import { SECOND } from '@revoke.cash/core/utils/time';
import {
  type ColumnSort,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import ChainSectionHeader from 'components/common/ChainSectionHeader';
import CollapsibleCard from 'components/common/CollapsibleCard';
import Spinner from 'components/common/Spinner';
import type { ChainAllowanceData } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { useTimeMachine } from 'lib/hooks/page-context/TimeMachineContext';
import { timeago } from 'lib/i18n/timeago';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import Table from '../../common/table/Table';
import { ColumnId, columns } from './columns';
import NoAllowancesFound from './NoAllowancesFound';

interface Props {
  chainData: ChainAllowanceData;
  onUpdate: OnUpdate;
  sorting: ColumnSort[];
  spenderFilters: string[];
  allExpanded: boolean;
  defaultExpanded?: boolean;
}

const getRowId = (row: TokenAllowanceData) => {
  return `${row.chainId}-${row.contract.address}-${row.payload?.spender}-${(row.payload as Erc721SingleAllowance)?.tokenId}`;
};

const ChainAllowanceSection = ({
  chainData,
  onUpdate,
  sorting,
  spenderFilters,
  allExpanded,
  defaultExpanded,
}: Props) => {
  const { timestamp: timeMachineTimestamp } = useTimeMachine();
  const { status, allowances } = chainData;

  const [isExpanded, setIsExpanded] = useState(() => {
    if (!isNullish(defaultExpanded)) return defaultExpanded;
    return status === 'success' && allowances.length > 0;
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - only auto-expand on status change
  useEffect(() => {
    if (!allExpanded) return;
    if (status === 'success' && allowances.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [status, allowances.length, allExpanded]);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const data = useMemo(() => allowances, [allowances]);
  const columnFilters = useMemo(
    () => (spenderFilters.length > 0 ? [{ id: ColumnId.SPENDER, value: spenderFilters }] : []),
    [spenderFilters],
  );

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
      sorting,
      columnFilters,
      columnVisibility: {
        [ColumnId.BALANCE]: false,
        [ColumnId.VALUE_AT_RISK]: isNullish(timeMachineTimestamp),
      },
    },
    enableRowSelection: (row) =>
      isNullish(timeMachineTimestamp) &&
      !isNullish(row.original.payload) &&
      isNullish(row.original.payload?.revokeError),
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel<TokenAllowanceData>(),
    getSortedRowModel: getSortedRowModel<TokenAllowanceData>(),
    getFilteredRowModel: getFilteredRowModel<TokenAllowanceData>(),
    getRowId,
    meta: { onUpdate, timeMachineTimestamp } as any,
  });

  const canExpand = status === 'success' && allowances.length > 0;

  useEffect(() => {
    if (!canExpand) return;
    setIsExpanded(allExpanded);
  }, [canExpand, allExpanded]);

  const toggleExpanded = () => canExpand && setIsExpanded(!isExpanded);

  if (status === 'success' && table.getFilteredRowModel().rows.length === 0) {
    return null;
  }

  return (
    <CollapsibleCard
      isExpanded={canExpand && isExpanded}
      canExpand={canExpand}
      onToggle={toggleExpanded}
      className={twMerge(
        status === 'error'
          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black',
      )}
      headerClassName={twMerge(canExpand && 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50')}
      contentClassName="border-zinc-200 dark:border-zinc-800"
      header={<Header chainData={chainData} />}
    >
      <Table
        table={table}
        loading={false}
        error={null}
        emptyChildren={<NoAllowancesFound allowances={allowances} />}
        className="border-none"
      />
    </CollapsibleCard>
  );
};

interface HeaderProps {
  chainData: ChainAllowanceData;
}

const Header = ({ chainData }: HeaderProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const { chainId, status, error, allowances, totalValueAtRisk } = chainData;
  const { lastChecked, isRefreshing, refreshError, refetch } = chainData;
  const formattedValue = formatFiatAmount(totalValueAtRisk);

  const lastCheckedText = lastChecked ? timeago.format(new Date(lastChecked), locale) : t('address.allowances.unknown');
  const lastCheckedAge = lastChecked ? Date.now() - new Date(lastChecked).getTime() : 0;
  const showLastChecked = isRefreshing || !isNullish(refreshError) || lastCheckedAge < 5 * SECOND;

  const totalValueAtRiskIsSignificant = (formattedValue: string | null): boolean => {
    if (!formattedValue) return false;
    return formattedValue !== '$0.00' && !formattedValue.startsWith('<');
  };

  return (
    <ChainSectionHeader chainId={chainId} status={status} error={error} refetch={refetch}>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          {t('address.allowances.count', { count: allowances.length })}
        </span>
        {totalValueAtRiskIsSignificant(formattedValue) && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">{formattedValue}</span>
        )}
        {showLastChecked && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {isRefreshing ? <Spinner className="w-3 h-3 mx-0" /> : null}
            <span>
              {t('address.headers.last_checked')}: {lastCheckedText}
            </span>
          </span>
        )}
      </div>
    </ChainSectionHeader>
  );
};

export default ChainAllowanceSection;
