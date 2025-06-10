'use client';

import { useQuery } from '@tanstack/react-query';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import Loader from 'components/common/Loader';
import { isNullish } from 'lib/utils';
import { getSpenderData } from 'lib/utils/whois';
import { useMemo } from 'react';
import type { Address } from 'viem';

interface Props {
  address: Address;
  chainId: number;
  isLoading?: boolean;
  ignoredRiskFactors?: string[];
}

const AddressCellWithRiskData = ({ address, chainId, isLoading: isLoadingOverride, ignoredRiskFactors }: Props) => {
  const { data: spenderData, isLoading } = useQuery({
    queryKey: ['spenderData', address, chainId],
    queryFn: () => getSpenderData(address, chainId),
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !isNullish(address),
  });

  const riskFactors = useMemo(() => {
    return spenderData?.riskFactors?.filter((factor) => !ignoredRiskFactors?.includes(factor.type)) ?? [];
  }, [spenderData?.riskFactors, ignoredRiskFactors]);

  return (
    <Loader isLoading={isLoading || Boolean(isLoadingOverride)}>
      <AddressCell
        address={address}
        spenderData={spenderData ? { ...spenderData, riskFactors } : undefined}
        chainId={chainId}
      />
    </Loader>
  );
};

export default AddressCellWithRiskData;
