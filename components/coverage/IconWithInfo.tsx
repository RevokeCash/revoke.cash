'use client';

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

interface Props {
  type: 'check' | 'x';
  text: string;
  className?: string;
}

const IconWithInfo = ({ type, text, className }: Props) => {
  const Icon = type === 'check' ? CheckCircleIcon : XCircleIcon;
  const iconColorClass = type === 'check' ? 'text-green-500' : 'text-red-500';

  return (
    <div className={twMerge('flex items-center gap-2', className)}>
      <Icon className={twMerge('w-6 h-6 shrink-0', iconColorClass)} />
      <p>{text}</p>
    </div>
  );
};

export default IconWithInfo;
