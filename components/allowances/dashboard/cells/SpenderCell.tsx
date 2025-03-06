import { useQuery } from '@tanstack/react-query';
import Loader from 'components/common/Loader';
import { isNullish } from 'lib/utils';
import { AllowanceType, type TokenAllowanceData } from 'lib/utils/allowances';
import { YEAR } from 'lib/utils/time';
import { getSpenderData } from 'lib/utils/whois';
import { useMemo } from 'react';
import AddressCell from './AddressCell';

interface Props {
  allowance: TokenAllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  // TODO: Expose this data to react-table
  const { data: spenderData, isLoading } = useQuery({
    queryKey: ['spenderData', allowance.payload?.spender, allowance.chainId],
    queryFn: () => getSpenderData(allowance.payload!.spender, allowance.chainId),
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !isNullish(allowance.payload?.spender),
  });

  // Add non-spender-specific risk factors (TODO: set up a proper system for this)
  const riskFactors = useMemo(() => {
    const factors = spenderData?.riskFactors ?? [];

    if (allowance?.payload?.type === AllowanceType.PERMIT2 && allowance?.payload?.expiration > Date.now() + 1 * YEAR) {
      return [...factors, { type: 'excessive_expiration', source: 'onchain' }];
    }

    return factors;
  }, [allowance?.payload, spenderData?.riskFactors]);

  if (!allowance.payload?.spender) return null;

  return (
    <Loader isLoading={isLoading}>
      <AddressCell
        address={allowance.payload.spender}
        spenderData={spenderData ? { name: spenderData.name, riskFactors } : undefined}
        chainId={allowance.chainId}
      />
    </Loader>
  );
};

export default SpenderCell;
