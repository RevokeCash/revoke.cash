import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import Table from 'components/common/table/Table';
import { usePermitTokens } from 'lib/hooks/ethereum/usePermitTokens';
import { PermitTokenData } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import { ColumnId, columns } from './columns';

const PermitsTable = () => {
  const { t } = useTranslation();
  const { permitTokens, isLoading, error, onCancel } = usePermitTokens();

  const table = useReactTable({
    data: permitTokens,
    columns,
    getCoreRowModel: getCoreRowModel<PermitTokenData>(),
    getSortedRowModel: getSortedRowModel<PermitTokenData>(),
    getFilteredRowModel: getFilteredRowModel<PermitTokenData>(),
    getRowId(row) {
      return `${row.contract.address}`;
    },
    // TODO: Because of declaration merging in @tanstack/table-core we can't have multiple custom fields and need to type as any
    // See https://github.com/TanStack/table/discussions/4220
    meta: { onCancel } as any,
    initialState: {
      columnVisibility: {
        [ColumnId.BALANCE]: false,
      },
    },
  });

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address:signatures.permit.title')}</div>
      <div className="font-normal">
        <WithHoverTooltip tooltip={t('address:tooltips.permit_signatures')}>
          <div>
            <InformationCircleIcon className="w-4 h-4" />
          </div>
        </WithHoverTooltip>
      </div>
    </div>
  );

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('address:signatures.permit.none_found')}
        loaderRows={6}
        className="border-none"
      />
    </Card>
  );
};

export default PermitsTable;
