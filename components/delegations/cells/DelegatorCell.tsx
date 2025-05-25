'use client';

import AddressDisplay from 'components/address/AddressDisplay';
import type { Delegation } from 'lib/delegate/DelegatePlatform';

interface Props {
  delegation: Delegation;
}

const DelegatorCell = ({ delegation }: Props) => {
  return <AddressDisplay address={delegation.delegator} />;
};

export default DelegatorCell;
