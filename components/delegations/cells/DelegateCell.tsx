'use client';

import AddressDisplay from 'components/address/AddressDisplay';
import type { Delegation } from 'lib/delegate/DelegatePlatform';

interface Props {
  delegation: Delegation;
}

const DelegateCell = ({ delegation }: Props) => {
  return (
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
      <AddressDisplay address={delegation.delegate} />
    </td>
  );
};

export default DelegateCell;
