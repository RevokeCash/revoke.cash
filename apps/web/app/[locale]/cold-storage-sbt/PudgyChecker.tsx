'use client';

import { getAllowanceKey, simulateRevokeAllowance, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import Loader from 'components/common/Loader';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import analytics from 'lib/utils/analytics';
import type { Address } from 'viem';
import { type Config, useConfig } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import PudgyCheckerStatus, { type PudgyCheckerStatusString } from './PudgyCheckerStatus';
import { alreadyOwnsSoulboundToken, canMint } from './utils';

const PudgyChecker = () => {
  const { address } = useAddress();
  const { allowances, isLoading } = useAddressAllowances();
  const config = useConfig();

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['pudgy-checker', allowances?.map(getAllowanceKey)],
    queryFn: async () => {
      const status = await getPudgyCheckerStatus(address, allowances!, config);
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
  config: Config,
): Promise<PudgyCheckerStatusString> => {
  if (await checkAlreadyClaimed(address)) {
    return 'already_claimed';
  }

  if (!(await canMint(address))) {
    return 'no_tokens';
  }

  const simulatedAllowances = await Promise.all(
    allowances.map((allowance) =>
      simulateRevokeAllowance(allowance, getPublicClient(config, { chainId: allowance.chainId })!),
    ),
  );

  // Filter out allowances that cannot be revoked
  const filteredAllowances = simulatedAllowances.filter((allowance) => isNullish(allowance.payload.revokeError));

  if (filteredAllowances.length > 0) {
    return 'has_allowances';
  }

  return 'eligible';
};

const checkAlreadyClaimed = async (address: Address): Promise<boolean> => alreadyOwnsSoulboundToken(address);
