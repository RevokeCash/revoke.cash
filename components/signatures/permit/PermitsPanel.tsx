import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { filterLastCancelled } from 'components/allowances/dashboard/cells/LastCancelledCell';
import Card from 'components/common/Card';
import Error from 'components/common/Error';
import TableBodyLoader from 'components/common/TableBodyLoader';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressAllowances, useAddressEvents } from 'lib/hooks/page-context/AddressPageContext';
import { deduplicateArray } from 'lib/utils';
import { getAllowanceKey, stripAllowanceData } from 'lib/utils/allowances';
import { filterAsync } from 'lib/utils/promises';
import { hasSupportForPermit, hasZeroBalance } from 'lib/utils/tokens';
import useTranslation from 'next-translate/useTranslation';
import { useLayoutEffect, useState } from 'react';
import PermitsEntry from './PermitsEntry';

const PermitsPanel = () => {
  const ROW_HEIGHT = 52;
  const [loaderHeight, setLoaderHeight] = useState<number>(ROW_HEIGHT * 12);

  useLayoutEffect(() => {
    // 530 is around the size of the headers and controls (and at least 2 row also on small screens)
    setLoaderHeight(Math.max(window.innerHeight - 530, 2 * ROW_HEIGHT + 68));
  }, []);

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
        .filter(async (token) => {
          const alreadyCancelled = (await filterLastCancelled(events, token)).alreadyCancelled;
          return !hasZeroBalance(token.balance, token.metadata.decimals) && !alreadyCancelled && token;
        })
        .map(stripAllowanceData);
      // console.log("ownedTokens", ownedTokens)

      return filterAsync(ownedTokens, (token) => hasSupportForPermit(token.contract));
    },
    enabled: !!allowances,
    staleTime: Infinity,
  });

  const isLoading = isAllowancesLoading || isPermitsLoading || !permitTokens;
  const error = allowancesError || permitsError;

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address:signatures.permit.title')}</div>
      <WithHoverTooltip tooltip={t('address:tooltips.permit_signatures')}>
        <div>
          <InformationCircleIcon className="w-4 h-4" />
        </div>
      </WithHoverTooltip>
    </div>
  );

  if (error) {
    return (
      <Card title={title} className="w-full flex justify-center items-center h-12">
        <Error error={error} />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card title={title} className="w-full p-0">
        <table className="w-full border-collapse">
          <TableBodyLoader columns={1} rows={Math.floor(loaderHeight / ROW_HEIGHT)} className="max-sm:hidden" />
          <TableBodyLoader columns={1} rows={Math.floor((loaderHeight - 68) / ROW_HEIGHT)} className="sm:hidden" />
        </table>
      </Card>
    );
  }

  if (permitTokens.length === 0) {
    return (
      <Card title={title} className="w-full flex justify-center items-center h-12">
        <p className="text-center">{t('address:signatures.permit.none_found')}</p>
      </Card>
    );
  }

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="w-full">
        {permitTokens.map((token) => (
          <PermitsEntry key={token.contract.address} token={token} />
        ))}
      </div>
    </Card>
  );
};

export default PermitsPanel;
