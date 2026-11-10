import { ExclamationTriangleIcon, InformationCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import type { ComponentType, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  style: 'info' | 'warning' | 'danger';
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

const NoticeBanner = ({ style, icon, action, children, className }: Props) => {
  const styleClasses = {
    info: 'border-brand/50 bg-brand/5 dark:bg-brand/10',
    warning: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20',
    danger: 'border-red-500/50 bg-red-50 dark:bg-red-950/20',
  };

  const iconClasses = {
    info: 'text-brand',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  const defaultIcons = {
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
    danger: ShieldExclamationIcon,
  };

  const Icon = icon ?? defaultIcons[style];

  return (
    <div className={twMerge('rounded-lg border p-4 flex items-start gap-3', styleClasses[style], className)}>
      <Icon className={twMerge('h-6 w-6 shrink-0', iconClasses[style])} />
      {/* The action wraps below the text at the same left edge. From sm up it stays beside text of at least 20rem */}
      <div className="flex-1 min-h-6 flex flex-wrap items-center gap-3">
        <p className="grow sm:basis-80 text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
        {action}
      </div>
    </div>
  );
};

export default NoticeBanner;
