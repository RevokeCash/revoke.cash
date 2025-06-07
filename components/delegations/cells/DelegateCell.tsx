'use client';

import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import type { Delegation } from 'lib/delegate/DelegatePlatform';

interface Props {
  delegation: Delegation;
}

const DelegateCell = ({ delegation }: Props) => {
  return (
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
      <AddressCell address={delegation.delegate} chainId={delegation.chainId} />
    </td>
  );
};

export default DelegateCell;
