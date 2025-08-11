'use client';

import { useQuery } from '@tanstack/react-query';
import Loader from 'components/common/Loader';
import { useAddressAllowances, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { isNullish } from 'lib/utils';
import { type TokenAllowanceData, getAllowanceKey } from 'lib/utils/allowances';
import analytics from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import PudgyCheckerStatus, { type PudgyCheckerStatusString } from './PudgyCheckerStatus';
import { canMint } from './utils';

const PudgyChecker = () => {
  const t = useTranslations();
  const { address } = useAddressPageContext();
  const { allowances, isLoading } = useAddressAllowances();

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['pudgy-checker', allowances?.map(getAllowanceKey)],
    queryFn: () => {
      const status = getPudgyCheckerStatus(allowances!);
      analytics.track('Pudgy Checked', { account: address, status });
      return status;
    },
    enabled: !isNullish(allowances),
  });

  return (
    <Loader isLoading={isLoading || isLoadingStatus}>
      <PudgyCheckerStatus address={address} status={status ?? 'has_allowances'} />
    </Loader>
  );
};

export default PudgyChecker;

const getPudgyCheckerStatus = (allowances: TokenAllowanceData[]): PudgyCheckerStatusString => {
  // TODO: Check if user has already claimed
  // Check balance of SBT to see if they have it

  if (!canMint(allowances)) {
    return 'no_tokens';
  }

  if (allowances.filter((allowance) => Boolean(allowance.payload?.spender)).length > 0) {
    return 'has_allowances';
  }

  return 'eligible';
};
