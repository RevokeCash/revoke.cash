'use client';

import { useMounted } from 'lib/hooks/useMounted';
import { getChainLogo, getChainName, isSupportedChain } from 'lib/utils/chains';
import { memo } from 'react';
import { twMerge } from 'tailwind-merge';
import Logo from './Logo';
import PlaceholderIcon from './PlaceholderIcon';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  chainId: number;
  size?: number;
  tooltip?: boolean;
  className?: string;
  checkMounted?: boolean;
}

const ChainLogo = memo(({ chainId, size, tooltip, className, checkMounted }: Props) => {
  const isMounted = useMounted();
  const name = getChainName(chainId);
  const src = getChainLogo(chainId);
  const classes = twMerge(!isSupportedChain(chainId) && 'grayscale', className);

  if (checkMounted && !isMounted) {
    return <PlaceholderIcon size={size ?? 24} border className={twMerge('bg-transparent', classes)} />;
  }

  if (tooltip) {
    return (
      <WithHoverTooltip tooltip={name} placement="top">
        <div>
          <Logo src={src} alt={`${name} Logo`} size={size} border className={classes} />
        </div>
      </WithHoverTooltip>
    );
  }

  return <Logo src={src} alt={name} size={size} border className={classes} />;
});

export default memo(ChainLogo);
