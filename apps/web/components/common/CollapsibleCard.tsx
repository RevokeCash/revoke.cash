'use client';

import Chevron from 'components/common/Chevron';
import { type ReactNode, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  isExpanded: boolean;
  onToggle: () => void;
  canExpand?: boolean;
  stickyHeader?: boolean;
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
  stickyHeader = false,
  header,
  children,
  className,
  headerClassName,
  contentClassName,
}: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const headerIsSticky = stickyHeader && isExpanded;

  const classes = {
    // overflow-hidden would make the card a scroll container, which the sticky header and table header rows would follow
    card: 'rounded-lg border overflow-clip',
    // The height of the sticky header, a table inside this card stops its header rows below this value
    tableHeaderTop: '[--table-header-top:3.25rem]',
    // Table rows pass under this header, so it needs an opaque background and square corners, also on hover. The focus
    // ring still follows the rounded card. The top border of the content does not stay with the header, so the line
    // below the header is drawn on the header. A sticky element prints at its scrolled position, so print uses relative.
    stickyHeader:
      'sticky top-0 print:relative z-4 rounded-none focus-visible:rounded-t-[0.425rem] bg-white dark:bg-black dark:hover:bg-zinc-900 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-zinc-200 dark:after:bg-zinc-800 forced-colors:after:bg-[CanvasText]!',
  };

  const toggle = () => {
    // Collapsing removes the content below a stuck header, which would otherwise leave the window inside a later card
    const cardRect = cardRef.current?.getBoundingClientRect();
    const headerIsStuck = headerIsSticky && cardRect && cardRect.top < 0 && cardRect.bottom > 0;
    if (headerIsStuck) cardRef.current?.scrollIntoView();
    onToggle();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (canExpand && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div ref={cardRef} className={twMerge(classes.card, stickyHeader && classes.tableHeaderTop, className)}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: nested actionable controls can be present in header */}
      <div
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onClick={canExpand ? toggle : undefined}
        onKeyDown={canExpand ? onKeyDown : undefined}
        className={twMerge(
          'w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors',
          isExpanded ? 'rounded-t-[0.425rem]' : 'rounded-[0.425rem]',
          'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white',
          canExpand && 'cursor-pointer',
          headerClassName,
          stickyHeader && 'h-(--table-header-top)',
          headerIsSticky && classes.stickyHeader,
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
