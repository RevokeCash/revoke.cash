import Loader from 'components/common/Loader';
import { AllowanceType, type TokenAllowanceData } from 'lib/utils/allowances';
import { YEAR } from 'lib/utils/time';
import { useMemo } from 'react';
import AddressCell from './AddressCell';

interface Props {
  allowance: TokenAllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  // Spender data is now provided via the enhanced allowances hook
  const spenderData = allowance.payload?.spenderData;
  const isLoading = spenderData === undefined && !!allowance.payload?.spender;

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
    <Loader isLoading={isLoading} className="h-6">
      <AddressCell
        address={allowance.payload.spender}
        spenderData={spenderData ? { name: spenderData.name, riskFactors } : undefined}
        chainId={allowance.chainId}
      />
    </Loader>
  );
};

export default SpenderCell;
