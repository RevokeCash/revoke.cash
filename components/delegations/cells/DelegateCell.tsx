'use client';

import AddressCellWithRiskData from 'components/allowances/dashboard/cells/AddressCellWithRiskData';
import type { Delegation } from 'lib/delegations/DelegatePlatform';

interface Props {
  delegation: Delegation;
}

const DelegateCell = ({ delegation }: Props) => {
  return (
    <AddressCellWithRiskData
      address={delegation.delegate}
      chainId={delegation.chainId}
      // We expect delegates to usually be an EOA / uninitialized account
      ignoredRiskFactors={['eoa', 'uninitialized']}
    />
  );
};

export default DelegateCell;
