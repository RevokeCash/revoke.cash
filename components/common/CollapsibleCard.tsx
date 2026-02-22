'use client';

import Chevron from 'components/common/Chevron';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  isExpanded: boolean;
  onToggle: () => void;
  canExpand?: boolean;
  header: ReactNode;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const CollapsibleCard = ({
  isExpanded,
  onToggle,
  canExpand = true,
  header,
  children,
  className,
  headerClassName,
  contentClassName,
}: Props) => {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (canExpand && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className={twMerge('rounded-lg border overflow-hidden', className)}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: nested actionable controls can be present in header */}
      <div
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onClick={canExpand ? onToggle : undefined}
        onKeyDown={canExpand ? onKeyDown : undefined}
        className={twMerge(
          'w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors',
          canExpand && 'cursor-pointer',
          headerClassName,
        )}
      >
        {header}
        {canExpand && (
          <Chevron
            className={twMerge(
              'w-5 h-5 transition-transform fill-zinc-500 dark:fill-zinc-400 shrink-0',
              isExpanded && 'rotate-180',
            )}
          />
        )}
      </div>
      {isExpanded && children && <div className={twMerge('border-t', contentClassName)}>{children}</div>}
    </div>
  );
};

export default CollapsibleCard;
