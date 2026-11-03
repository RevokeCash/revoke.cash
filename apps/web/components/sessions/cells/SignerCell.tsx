import type { Session } from '@revoke.cash/core/sessions';
import { isNullish } from '@revoke.cash/core/utils';
import { YEAR } from '@revoke.cash/core/utils/time';
import { useQuery } from '@tanstack/react-query';
import Loader from 'components/common/Loader';
import { getSpenderDataQuery } from 'lib/hooks/ethereum/useSpenderData';
import { useMemo } from 'react';
import AddressCell from '../../allowances/dashboard/cells/AddressCell';

interface Props {
  session: Session;
}

const SignerCell = ({ session }: Props) => {
  // TODO: Expose this data to react-table
  const signer = session.payload?.sessionSpec.signer;
  const { data: signerData, isLoading } = useQuery({
    ...getSpenderDataQuery(session.chainId, signer!),
    enabled: !isNullish(signer),
  });

  // Add non-spender-specific risk factors (TODO: set up a proper system for this)
  const riskFactors = useMemo(() => {
    // For sessions, we don't care about uninitialized or eoa risk factors
    const factors = (signerData?.riskFactors ?? []).filter((factor) => !['uninitialized', 'eoa'].includes(factor.type));

    const sessionSpec = session?.payload?.sessionSpec;
    if (sessionSpec?.expiresAt && sessionSpec?.expiresAt * 1000n > Date.now() + 1 * YEAR) {
      return [...factors, { type: 'excessive_expiration', source: 'onchain' }];
    }

    return factors;
  }, [session?.payload, signerData?.riskFactors]);

  if (!signer) return null;

  return (
    <Loader isLoading={isLoading}>
      <AddressCell address={signer} spenderData={{ name: signerData?.name, riskFactors }} chainId={session.chainId} />
    </Loader>
  );
};

export default SignerCell;
