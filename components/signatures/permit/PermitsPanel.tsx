import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import Error from 'components/common/Error';
import Spinner from 'components/common/Spinner';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import { deduplicateArray } from 'lib/utils';
import { stripAllowanceData } from 'lib/utils/allowances';
import { filterAsync } from 'lib/utils/promises';
import { hasSupportForPermit, hasZeroBalance } from 'lib/utils/tokens';
import useTranslation from 'next-translate/useTranslation';
import DashboardPanel from '../DashboardPanel';
import PermitsEntry from './PermitsEntry';

const PermitsPanel = () => {
  const { t } = useTranslation();
  const { allowances, error: allowancesError, isLoading: isAllowancesLoading } = useAddressAllowances();

  const {
    data: permitTokens,
    error: permitsError,
    isLoading: isPermitsLoading,
  } = useQuery({
    queryKey: ['permitTokens', allowances?.map((token) => token.contract.address)],
    queryFn: async () => {
      if (!allowances) return null;

      const ownedTokens = deduplicateArray(allowances, (a, b) => a.contract.address === b.contract.address)
        .filter((token) => !hasZeroBalance(token))
        .map(stripAllowanceData);

      return filterAsync(ownedTokens, (token) => hasSupportForPermit(token.contract));
    },
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
      <DashboardPanel title={title} className="w-full flex justify-center items-center h-12">
        <Error error={error} />
      </DashboardPanel>
    );
  }

  if (isLoading) {
    return (
      <DashboardPanel title={title} className="w-full flex justify-center items-center h-12">
        <Spinner className="w-6 h-6" />
      </DashboardPanel>
    );
  }

  if (permitTokens.length === 0) {
    return (
      <DashboardPanel title={title} className="w-full flex justify-center items-center h-12">
        <p className="text-center">{t('address:signatures.permit.none_found')}</p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="w-full">
        {permitTokens.map((token) => (
          <PermitsEntry key={token.contract.address} token={token} />
        ))}
      </div>
    </DashboardPanel>
  );
};

export default PermitsPanel;
