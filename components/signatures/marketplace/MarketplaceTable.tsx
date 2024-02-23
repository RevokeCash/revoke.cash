import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import Table from 'components/common/table/Table';
import { useMarketplaces } from 'lib/hooks/ethereum/useMarketplaces';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { Marketplace } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import { columns } from './columns';

const MarketplaceTable = () => {
  const { t } = useTranslation();
  const { selectedChainId, address } = useAddressPageContext();
  const { data: marketplaces, isLoading, error } = useMarketplaces(selectedChainId, address);

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address:signatures.marketplaces.title')}</div>
      <div className="font-normal">
        <WithHoverTooltip tooltip={t('address:tooltips.marketplace_signatures')}>
          <div>
            <InformationCircleIcon className="w-4 h-4" />
          </div>
        </WithHoverTooltip>
      </div>
    </div>
  );

  const table = useReactTable({
    data: marketplaces,
    columns,
    getCoreRowModel: getCoreRowModel<Marketplace>(),
    getSortedRowModel: getSortedRowModel<Marketplace>(),
    getFilteredRowModel: getFilteredRowModel<Marketplace>(),
    getRowId(row) {
      return `${row.name}`;
    },
    // meta: { onUpdate },
  });

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('address:signatures.marketplaces.none_found')}
        loaderRows={2}
        className="border-none"
      />
    </Card>
  );
};

export default MarketplaceTable;
