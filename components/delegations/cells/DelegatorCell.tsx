'use client';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import type { Delegation } from 'lib/delegations/DelegatePlatform';

interface Props {
  delegation: Delegation;
}

const DelegatorCell = ({ delegation }: Props) => {
  return <AddressCell address={delegation.delegator} chainId={delegation.chainId} />;
};

export default DelegatorCell;
