'use client';

import { useQuery } from '@tanstack/react-query';
import Label from 'components/common/Label';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import { getAccountType, isNullish } from 'lib/utils';
import { twMerge } from 'tailwind-merge';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { Eip7702DelegationDetails } from './eip7702/Eip7702DelegationDetails';

interface Props {
  address: Address;
}

const AccountTypeLabel = ({ address }: Props) => {
  const isMounted = useMounted();
  const { selectedChainId } = useAddressPageContext();
  const publicClient = usePublicClient({ chainId: selectedChainId })!;

  const { data: accountType, isLoading } = useQuery({
    queryKey: ['accountType', address, publicClient?.chain?.id],
    queryFn: () => getAccountType(address!, publicClient!),
    enabled: !isNullish(address) && !isNullish(publicClient?.chain),
  });

  if (!isMounted || isLoading) return <Label className="bg-transparent">&nbsp;</Label>;

  const classes = twMerge('bg-zinc-300 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100');

  if (accountType === 'EIP7702 Account') {
    return (
      <WithHoverTooltip tooltip={<Eip7702DelegationDetails address={address} chainId={selectedChainId} />}>
        <Label className={classes}>{accountType}</Label>
      </WithHoverTooltip>
    );
  }

  return <Label className={classes}>{accountType}</Label>;
};

export default AccountTypeLabel;
