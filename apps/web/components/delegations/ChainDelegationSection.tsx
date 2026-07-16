'use client';

import type { Delegation } from '@revoke.cash/core/delegations/DelegatePlatform';
import ChainSectionHeader from 'components/common/ChainSectionHeader';
import CollapsibleCard from 'components/common/CollapsibleCard';
import Table from 'components/common/table/Table';
import type { ChainDelegationsData } from 'lib/hooks/ethereum/delegations/usePremiumDelegations';
import { useTable } from 'lib/hooks/useTable';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { ColumnId, columns } from './columns';

interface Props {
  chainData: ChainDelegationsData;
  onRevoke: (delegation: Delegation) => void;
  defaultExpanded?: boolean;
}

const getDelegationRowId = (delegation: Delegation) => {
  return `${delegation.chainId}-${delegation.platform}-${delegation.direction}-${delegation.delegator}-${delegation.delegate}-${delegation.contract ?? 'null'}-${delegation.tokenId?.toString() ?? 'null'}-${'rights' in delegation ? delegation.rights : 'null'}`;
};

const ChainDelegationSection = ({ chainData, onRevoke, defaultExpanded }: Props) => {
  const t = useTranslations();
  const { status, delegations } = chainData;

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof defaultExpanded === 'boolean') return defaultExpanded;
    return status === 'success' && delegations.length > 0;
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - only auto-expand on status change
  useEffect(() => {
    if (status === 'success' && delegations.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [status, delegations.length]);

  const data = useMemo(() => delegations, [delegations]);

  const table = useTable({
    data,
    columns,
    getRowId: getDelegationRowId,
    columnVisibility: { [ColumnId.CHAIN]: false },
    meta: { onRevoke } as any,
    autoResetPageIndex: false,
  });

  const canExpand = status === 'success' && delegations.length > 0;
  const toggleExpanded = () => canExpand && setIsExpanded((value) => !value);

  return (
    <CollapsibleCard
      isExpanded={isExpanded}
      canExpand={canExpand}
      onToggle={toggleExpanded}
      className={twMerge(
        chainData.status === 'error'
          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black',
      )}
      headerClassName={twMerge(canExpand && 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50')}
      contentClassName="border-zinc-200 dark:border-zinc-800"
      header={
        <ChainSectionHeader
          chainId={chainData.chainId}
          status={chainData.status}
          error={chainData.error}
          refetch={chainData.refetch}
        >
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {t('address.delegations.count', { count: chainData.delegations.length })}
          </span>
        </ChainSectionHeader>
      }
    >
      <Table table={table} loading={false} error={null} emptyChildren={null} className="border-none" />
    </CollapsibleCard>
  );
};

export default ChainDelegationSection;
