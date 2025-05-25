'use client';

import { useQuery } from '@tanstack/react-query';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import Loader from 'components/common/Loader';
import { isNullish } from 'lib/utils';
import { getSpenderData } from 'lib/utils/whois';
import type { Address } from 'viem';

interface Props {
  address: Address;
  chainId: number;
  isLoading?: boolean;
}

const Eip7702DelegatedAddressCell = ({ address, chainId, isLoading: isLoadingOverride }: Props) => {
  const { data: spenderData, isLoading } = useQuery({
    queryKey: ['spenderData', address, chainId],
    queryFn: () => getSpenderData(address, chainId),
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !isNullish(address),
  });

  return (
    <Loader isLoading={isLoading || Boolean(isLoadingOverride)}>
      <AddressCell address={address} spenderData={spenderData ?? undefined} chainId={chainId} />
    </Loader>
  );
};

export default Eip7702DelegatedAddressCell;
