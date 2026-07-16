'use client';

import { getChainLogo, getChainName, isSupportedChain } from '@revoke.cash/core/chains';
import { useMounted } from 'lib/hooks/useMounted';
import { memo } from 'react';
import { twMerge } from 'tailwind-merge';
import Logo from './Logo';
import PlaceholderIcon from './PlaceholderIcon';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  chainId: number;
  size?: number;
  tooltip?: boolean;
  border?: boolean;
  className?: string;
  checkMounted?: boolean;
}

const ChainLogo = ({ chainId, size, tooltip, border = true, className, checkMounted }: Props) => {
  const isMounted = useMounted();
  const name = getChainName(chainId);
  const src = getChainLogo(chainId);
  const classes = twMerge(!isSupportedChain(chainId) && 'grayscale', className);

  if (checkMounted && !isMounted) {
    return <PlaceholderIcon size={size ?? 24} border={border} className={twMerge('bg-transparent', classes)} />;
  }

  if (tooltip) {
    return (
      <WithHoverTooltip tooltip={name}>
        <div>
          <Logo src={src} alt={`${name} Logo`} size={size} border={border} className={classes} />
        </div>
      </WithHoverTooltip>
    );
  }

  return <Logo src={src} alt={name} size={size} border={border} className={classes} />;
};

export default memo(ChainLogo);
