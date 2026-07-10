import type { Ref } from 'react';
import { twMerge } from 'tailwind-merge';
import Label from './Label';

export type Status = 'success' | 'info' | 'warning' | 'severe' | 'danger' | 'neutral';

const STATUS_CLASSES: Record<Status, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
  severe: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

interface Props {
  status: Status;
  children: React.ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

const StatusLabel = ({ status, children, className, ref }: Props) => {
  return (
    <Label className={twMerge(STATUS_CLASSES[status], className)} ref={ref}>
      {children}
    </Label>
  );
};

export default StatusLabel;
