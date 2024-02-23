import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import Table from 'components/common/table/Table';
import { useAddressAllowances, useAddressEvents } from 'lib/hooks/page-context/AddressPageContext';
import { PermitTokenData } from 'lib/interfaces';
import { deduplicateArray } from 'lib/utils';
import { getAllowanceKey, stripAllowanceData } from 'lib/utils/allowances';
import { getLastCancelled } from 'lib/utils/permit';
import { filterAsync, mapAsync } from 'lib/utils/promises';
import { hasSupportForPermit, hasZeroBalance } from 'lib/utils/tokens';
import useTranslation from 'next-translate/useTranslation';
import { ColumnId, columns } from './columns';

const PermitsTable = () => {
  const { t } = useTranslation();
  const { allowances, error: allowancesError, isLoading: isAllowancesLoading } = useAddressAllowances();
  const { events } = useAddressEvents();
  const {
    data: permitTokens,
    error: permitsError,
    isLoading: isPermitsLoading,
  } = useQuery({
    queryKey: ['permitTokens', allowances?.map(getAllowanceKey)],
    queryFn: async () => {
      const ownedTokens = deduplicateArray(allowances, (a, b) => a.contract.address === b.contract.address)
        .filter((token) => !hasZeroBalance(token.balance, token.metadata.decimals) && token)
        .map(stripAllowanceData);

      const permitTokens = await mapAsync(
        filterAsync(ownedTokens, (token) => hasSupportForPermit(token.contract)),
        async (token) => ({ ...token, lastCancelled: await getLastCancelled(events.approval, token) }),
      );

      return permitTokens;
    },
    enabled: !!allowances,
    staleTime: Infinity,
  });

  const isLoading = isAllowancesLoading || isPermitsLoading || !permitTokens;
  const error = allowancesError || permitsError;

  const table = useReactTable({
    data: permitTokens,
    columns,
    getCoreRowModel: getCoreRowModel<PermitTokenData>(),
    getSortedRowModel: getSortedRowModel<PermitTokenData>(),
    getFilteredRowModel: getFilteredRowModel<PermitTokenData>(),
    getRowId(row) {
      return `${row.contract.address}`;
    },
    // meta: { onUpdate },
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
