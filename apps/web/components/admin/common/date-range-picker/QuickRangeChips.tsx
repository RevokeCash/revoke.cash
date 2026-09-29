'use client';

import { Button as HeadlessButton } from '@headlessui/react';
import { type DateRange, getQuickRange, isSameRange, QUICK_RANGES } from 'lib/admin/date-range';
import { twMerge } from 'tailwind-merge';

interface Props {
  value: DateRange;
  today: string;
  onSelect: (range: DateRange) => void;
  onPreview: (range: DateRange | null) => void;
}

const QuickRangeChips = ({ value, today, onSelect, onPreview }: Props) => (
  <div className="flex flex-wrap gap-1.5">
    {QUICK_RANGES.map(({ label, dayCount }) => {
      const chipRange = getQuickRange(dayCount, today);
      const isPressed = isSameRange(chipRange, value);

      return (
        <HeadlessButton
          key={dayCount}
          aria-pressed={isPressed}
          data-quick-range
          onClick={() => onSelect(chipRange)}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') onPreview(chipRange);
          }}
          onPointerLeave={() => onPreview(null)}
          className={twMerge(
            'h-7 whitespace-nowrap rounded-full border border-zinc-200 px-2.5 text-xs md:h-6 dark:border-zinc-800',
            'outline-hidden data-focus:ring-1 data-focus:ring-inset data-focus:ring-black dark:data-focus:ring-white',
            isPressed
              ? 'border-brand bg-brand/25 dark:border-brand dark:bg-brand/20'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-900',
          )}
        >
          {label}
        </HeadlessButton>
      );
    })}
  </div>
);

export default QuickRangeChips;
