import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
}

// Replica of apps/web/components/common/Card.tsx in dark mode
export const Panel = ({ title, children, className }: Props) => {
  return (
    <div className={twMerge('flex flex-col rounded-xl border border-zinc-800 bg-black', className)}>
      {title && (
        <div className="border-b border-zinc-800 px-4 py-2">
          <h2 className="font-heading text-xl font-semibold text-zinc-100">{title}</h2>
        </div>
      )}
      <div className="grow p-4">{children}</div>
    </div>
  );
};
