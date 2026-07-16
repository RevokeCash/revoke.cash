import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  align?: 'center' | 'left';
}

const ContentPageHero = ({ title, subtitle, children, className, align = 'center' }: Props) => {
  return (
    <div
      className={twMerge(
        'not-prose flex flex-col gap-2 py-8',
        align === 'center' && 'max-w-5xl mx-auto text-center gap-3',
        className,
      )}
    >
      <h1 className={twMerge('text-4xl font-semibold')}>{title}</h1>
      {subtitle && (
        <p className={twMerge('text-zinc-600 dark:text-zinc-400', align === 'center' && 'text-lg max-w-2xl mx-auto')}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
};

export default ContentPageHero;
