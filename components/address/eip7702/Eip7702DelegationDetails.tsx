'use client';

import { useQuery } from '@tanstack/react-query';
import { isNullish } from 'lib/utils';
import { getEip7702DelegatedAddress } from 'lib/utils/eip7702';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import Eip7702DelegatedAddressCell from './Eip7702DelegatedAddressCell';

interface Props {
  address: Address;
  chainId: number;
}

export const Eip7702DelegationDetails = ({ address, chainId }: Props) => {
  const publicClient = usePublicClient({ chainId });

  const { data: delegatedAddress, isLoading } = useQuery({
    queryKey: ['delegatedAddress', address, publicClient?.chain?.id],
    queryFn: () => getEip7702DelegatedAddress(address, publicClient!),
    enabled: !isNullish(address) && !isNullish(publicClient?.chain),
  });

  return (
    <div className="flex flex-col justify-center items-center gap-1">
      <div className="text-sm font-medium">Delegated To</div>
      <div className="w-full flex flex-row justify-between gap-2">
        <Eip7702DelegatedAddressCell address={delegatedAddress!} chainId={chainId} isLoading={isLoading} />
      </div>
    </div>
  );
};
