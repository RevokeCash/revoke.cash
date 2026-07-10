'use client';

import { isNullish } from '@revoke.cash/core/utils';
import { getAccountType } from '@revoke.cash/core/wallet';
import { useQuery } from '@tanstack/react-query';
import StatusLabel from 'components/common/StatusLabel';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { Eip7702DelegationDetails } from './eip7702/Eip7702DelegationDetails';

interface Props {
  address: Address;
}

const AccountTypeLabel = ({ address }: Props) => {
  const t = useTranslations();
  const isMounted = useMounted();
  const { selectedChainId } = useAddressPageContext();
  const publicClient = usePublicClient({ chainId: selectedChainId })!;

  const { data: accountType, isLoading } = useQuery({
    queryKey: ['accountType', address, publicClient?.chain?.id],
    queryFn: () => getAccountType(address!, publicClient!),
    enabled: !isNullish(address) && !isNullish(publicClient?.chain),
  });

  if (!isMounted || isLoading || !accountType) return null;

  if (accountType === 'eip7702') {
    return (
      <WithHoverTooltip tooltip={<Eip7702DelegationDetails address={address} chainId={selectedChainId} />}>
        <StatusLabel status="neutral">{t('address.labels.account_types.eip7702')}</StatusLabel>
      </WithHoverTooltip>
    );
  }

  return <StatusLabel status="neutral">{t(`address.labels.account_types.${accountType}`)}</StatusLabel>;
};

export default AccountTypeLabel;
