'use client';

import { type ForwardedRef, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import Spinner from './Spinner';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  pending?: boolean;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

const Toggle = (
  { checked, onChange, pending = false, disabled = false, label, size = 'md' }: Props,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  const trackClasses = twMerge(
    'relative inline-flex items-center shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none',
    size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
    checked ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-500',
    disabled && 'cursor-not-allowed opacity-50',
  );

  const thumbTranslate = size === 'sm' ? 'translate-x-5' : 'translate-x-6';
  const thumbClasses = twMerge(
    'pointer-events-none inline-block rounded-full shadow-sm transition-transform duration-200 mx-0',
    'bg-white dark:bg-zinc-900',
    size === 'sm' ? 'size-3' : 'size-4',
    checked ? thumbTranslate : 'translate-x-1',
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={trackClasses}
      ref={ref}
    >
      {pending ? <Spinner className={thumbClasses} /> : <span className={thumbClasses} />}
    </button>
  );
};

export default forwardRef(Toggle);
