'use client';

import { twMerge } from 'tailwind-merge';
import ChainLogo from './ChainLogo';

interface Props {
  chainIds: number[];
  maxVisible?: number;
  logoSize?: number;
  border?: boolean;
  className?: string;
  overlapClassName?: string;
  itemClassName?: string;
  overflowClassName?: string;
}

const ChainLogoStack = ({
  chainIds,
  maxVisible = 3,
  logoSize = 20,
  border = false,
  className,
  overlapClassName,
  itemClassName,
  overflowClassName,
}: Props) => {
  const visibleChainIds = chainIds.slice(0, maxVisible);
  const remainingCount = chainIds.length - visibleChainIds.length;

  if (chainIds.length === 0) return null;

  return (
    <span className={twMerge('flex items-center shrink-0', overlapClassName ?? '-space-x-2.5', className)}>
      {visibleChainIds.map((chainId) => (
        <span
          key={chainId}
          className={twMerge(
            'rounded-full bg-white dark:bg-zinc-900 ring-1 ring-white dark:ring-zinc-900',
            itemClassName,
          )}
        >
          <ChainLogo chainId={chainId} size={logoSize} border={border} />
        </span>
      ))}
      {remainingCount > 0 ? (
        <span
          className={twMerge(
            'h-5 min-w-5 px-1 rounded-full text-[11px] font-semibold flex items-center justify-center ring-1 ring-white dark:ring-zinc-900 bg-zinc-200 dark:bg-zinc-700',
            overflowClassName,
          )}
        >
          +{remainingCount}
        </span>
      ) : null}
    </span>
  );
};

export default ChainLogoStack;
