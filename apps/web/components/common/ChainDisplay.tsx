'use client';

import { getChainName } from '@revoke.cash/core/chains';
import { twMerge } from 'tailwind-merge';
import ChainLogo from './ChainLogo';

interface Props {
  chainId: number;
  logoSize?: number;
  className?: string;
}

const ChainDisplay = ({ chainId, logoSize = 18, className }: Props) => {
  return (
    <div className={twMerge('flex items-center gap-2', className)}>
      <ChainLogo chainId={chainId} size={logoSize} />
      <span className="font-medium truncate">{getChainName(chainId)}</span>
    </div>
  );
};

export default ChainDisplay;
