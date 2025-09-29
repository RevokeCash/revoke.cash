'use client';

import { useQuery } from '@tanstack/react-query';
import Loader from 'components/common/Loader';
import { useAddressAllowances, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { isNullish } from 'lib/utils';
import { type TokenAllowanceData, getAllowanceKey } from 'lib/utils/allowances';
import analytics from 'lib/utils/analytics';
import type { Address } from 'viem';
import PudgyCheckerStatus, { type PudgyCheckerStatusString } from './PudgyCheckerStatus';
import { alreadyOwnsSoulboundToken, canMint, checkIfAlreadyClaimedInCache } from './utils';

const PudgyChecker = () => {
  const { address } = useAddressPageContext();
  const { allowances, isLoading } = useAddressAllowances();

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['pudgy-checker', allowances?.map(getAllowanceKey)],
    queryFn: async () => {
      const status = await getPudgyCheckerStatus(address, allowances!);
      analytics.track('Pudgy Checked', { account: address, status });
      return status;
    },
    enabled: !isNullish(allowances),
  });

  if (!address) return null;

  return (
    <Loader isLoading={isLoading || isLoadingStatus}>
      <PudgyCheckerStatus address={address} status={status ?? 'has_allowances'} />
    </Loader>
  );
};

export default PudgyChecker;

const getPudgyCheckerStatus = async (
  address: Address,
  allowances: TokenAllowanceData[],
): Promise<PudgyCheckerStatusString> => {
  if (await checkAlreadyClaimed(address)) {
    return 'already_claimed';
  }

  if (!(await canMint(address))) {
    return 'no_tokens';
  }

  if (allowances.filter((allowance) => Boolean(allowance.payload?.spender)).length > 0) {
    return 'has_allowances';
  }

  return 'eligible';
};

const checkAlreadyClaimed = async (address: Address): Promise<boolean> => {
  return (await alreadyOwnsSoulboundToken(address)) || (await checkIfAlreadyClaimedInCache(address));
};
