import { useQuery } from '@tanstack/react-query';
import Loader from 'components/common/Loader';
import { isNullish } from 'lib/utils';
import type { Session } from 'lib/utils/sessions';
import { YEAR } from 'lib/utils/time';
import { getSpenderData } from 'lib/utils/whois';
import { useMemo } from 'react';
import AddressCell from '../../allowances/dashboard/cells/AddressCell';

interface Props {
  session: Session;
}

const SignerCell = ({ session }: Props) => {
  // TODO: Expose this data to react-table
  const { data: signerData, isLoading } = useQuery({
    queryKey: ['signerData', session.payload?.sessionSpec.signer, session.chainId],
    queryFn: () => getSpenderData(session.payload!.sessionSpec.signer, session.chainId),
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !isNullish(session.payload?.sessionSpec.signer),
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

  if (!session.payload?.sessionSpec.signer) return null;

  return (
    <Loader isLoading={isLoading}>
      <AddressCell
        address={session.payload.sessionSpec.signer}
        spenderData={signerData ? { name: signerData.name, riskFactors } : undefined}
        chainId={session.chainId}
      />
    </Loader>
  );
};

export default SignerCell;
