import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useMarketplaces } from 'lib/hooks/ethereum/useMarketplaces';
import type { Marketplace } from 'lib/interfaces';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { columns } from './columns';

const MarketplaceTable = () => {
  const t = useTranslations();
  const { marketplaces, isLoading, error, onCancel } = useMarketplaces();

  const data = useMemo(() => marketplaces ?? [], [marketplaces]);

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.signatures.marketplaces.title')}</div>
    </div>
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel<Marketplace>(),
    getSortedRowModel: getSortedRowModel<Marketplace>(),
    getFilteredRowModel: getFilteredRowModel<Marketplace>(),
    getRowId(row) {
      return `${row.name}`;
    },

    // biome-ignore lint/suspicious/noExplicitAny: Because of declaration merging in @tanstack/table-core we can't have multiple custom fields and need to type as any. See https://github.com/TanStack/table/discussions/4220
    meta: { onCancel } as any,
  });

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('address.signatures.marketplaces.none_found')}
        loaderRows={2}
        className="border-none"
      />
    </Card>
  );
};

export default MarketplaceTable;
