import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  children: ReactNode;
  className?: string;
}

const NavigationTabs = ({ children, className }: Props) => (
  <div className={twMerge('nav-tabs-scope relative w-full', className)}>
    <div className="nav-tabs-scroll flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full">
      <nav className="flex gap-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 w-fit">{children}</nav>
    </div>
    <div className="nav-tabs-fade nav-tabs-fade-left absolute inset-y-0 left-0 w-8 bg-linear-to-r from-white dark:from-black to-transparent pointer-events-none" />
    <div className="nav-tabs-fade nav-tabs-fade-right absolute inset-y-0 right-0 w-8 bg-linear-to-l from-white dark:from-black to-transparent pointer-events-none" />
  </div>
);

export default NavigationTabs;
