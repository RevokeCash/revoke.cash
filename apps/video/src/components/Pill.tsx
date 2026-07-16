import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  children: ReactNode;
  className?: string;
}

// Replica of apps/web/components/common/Label.tsx
export const Pill = ({ children, className }: Props) => {
  return (
    <div
      className={twMerge('flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold', className)}
    >
      {children}
    </div>
  );
};
