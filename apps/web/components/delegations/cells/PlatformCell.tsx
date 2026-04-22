'use client';

import Label from 'components/common/Label';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
import { twMerge } from 'tailwind-merge';

interface Props {
  delegation: Delegation;
}

const PlatformCell = ({ delegation }: Props) => {
  const labelColor = twMerge(
    'bg-zinc-500',
    delegation.platform === 'Delegate.xyz V2' && 'bg-[#04724d]/90 text-white',
    delegation.platform === 'Delegate.xyz V1' && 'bg-[#ffc300]/90 text-black',
    delegation.platform === 'Warm.xyz' && 'bg-[#f47f1d]/80 text-black',
  );
  return (
    <div className="h-12.5 flex items-center">
      <Label className={labelColor}>{delegation.platform}</Label>
    </div>
  );
};

export default PlatformCell;
