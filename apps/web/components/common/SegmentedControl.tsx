import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface Props<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

const SegmentedControl = <T extends string>({ options, value, onChange, disabled = false }: Props<T>) => {
  const activeIndex = options.findIndex((option) => option.value === value);
  const count = options.length;

  return (
    <div
      className={twMerge(
        'relative inline-grid rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
    >
      {activeIndex >= 0 && (
        <span
          className="absolute inset-y-0.5 rounded-md bg-zinc-900 dark:bg-zinc-100 transition-transform duration-200"
          style={{
            width: `calc(${100 / count}% - 2px)`,
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 2}px))`,
          }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={twMerge(
            'relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200',
            value === option.value ? 'text-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
