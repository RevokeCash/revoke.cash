'use client';

import type { Delegation } from 'lib/delegate/DelegatePlatform';

interface Props {
  delegation: Delegation;
}

const PlatformCell = ({ delegation }: Props) => {
  return (
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
      <div className="flex items-center">
        <span>{delegation.platform}</span>
      </div>
    </td>
  );
};

export default PlatformCell;
