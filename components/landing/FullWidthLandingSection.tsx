import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  title?: string;
  children: ReactNode;
  inverted?: boolean;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
} as const;

const FullWidthLandingSection = ({ title, children, inverted, size = 'lg', className }: Props) => {
  return (
    <div className={twMerge('w-full px-4', inverted && 'bg-black dark:bg-zinc-900 text-zinc-100 py-12', className)}>
      <div className={twMerge('mx-auto flex flex-col gap-8', SIZE_CLASSES[size])}>
        {title && <h2 className="text-center">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default FullWidthLandingSection;
