'use client';

import { useScrollFades } from 'lib/hooks/useScrollFades';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import ScrollFade from './ScrollFade';

interface Props {
  children: ReactNode;
  className?: string;
}

const NavigationTabs = ({ children, className }: Props) => {
  const { scrollContainerRef, canScrollLeft, canScrollRight } = useScrollFades<HTMLDivElement>();

  return (
    <div className={twMerge('relative w-full', className)}>
      <div ref={scrollContainerRef} className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full">
        <nav className="flex gap-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 w-fit">{children}</nav>
      </div>
      <ScrollFade side="left" visible={canScrollLeft} />
      <ScrollFade side="right" visible={canScrollRight} />
    </div>
  );
};

export default NavigationTabs;
