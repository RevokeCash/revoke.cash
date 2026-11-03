'use client';

import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import Loader from 'components/common/Loader';
import { getSpenderDataQuery } from 'lib/hooks/ethereum/useSpenderData';
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
    ...getSpenderDataQuery(chainId, address),
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
