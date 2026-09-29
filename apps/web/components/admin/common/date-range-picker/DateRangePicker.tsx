'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { getAnchoredMenuClassName } from 'components/common/select/common';
import { clampToToday, type DateRange, formatDayRange, formatRangeLabel, getToday } from 'lib/admin/date-range';
import { useId } from 'react';
import { twMerge } from 'tailwind-merge';
import DateRangePanel from './DateRangePanel';
import RangeStepButton from './RangeStepButton';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangePicker = ({ value, onChange }: Props) => {
  const today = getToday();
  const label = formatRangeLabel(value, today);
  const keyboardHintId = useId();

  return (
    <Popover
      role="group"
      aria-label="Date range"
      className="inline-flex h-6 items-stretch divide-x divide-zinc-300 rounded-md border border-zinc-300 bg-white text-xs font-medium text-black dark:divide-zinc-700 dark:border-zinc-700 dark:bg-black dark:text-white"
    >
      <PopoverButton
        aria-label={`Date range: ${label} (${formatDayRange(clampToToday(value, today))})`}
        className={twMerge(
          'flex min-w-36 items-center gap-1.5 whitespace-nowrap rounded-l-md px-2 tabular-nums',
          'hover:bg-zinc-200 data-open:bg-zinc-200 dark:hover:bg-zinc-800 dark:data-open:bg-zinc-800',
          'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white',
        )}
      >
        <CalendarDaysIcon className="size-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
        {label}
      </PopoverButton>
      <RangeStepButton direction={-1} value={value} today={today} onChange={onChange} />
      <RangeStepButton direction={1} value={value} today={today} onChange={onChange} />
      <PopoverPanel
        // The panel anchors to the label, so the offset lines it up with the end of the two step buttons (w-6) and the border
        anchor={{ to: 'bottom end', gap: 8, padding: 16, offset: 49 }}
        transition
        role="dialog"
        aria-label="Choose date range"
        aria-describedby={keyboardHintId}
        className={twMerge(
          getAnchoredMenuClassName(),
          'w-[calc(100vw-2rem)] text-sm md:w-[46rem] lg:w-[50rem]',
          'transition duration-100 ease-out data-closed:-translate-y-1 data-closed:opacity-0',
        )}
      >
        <DateRangePanel value={value} today={today} onChange={onChange} />
        <p id={keyboardHintId} className="sr-only">
          Arrow keys move between periods. Up and Down switch between months, quarters and years. Page Up and Page Down
          move one year, or one month in the calendar. Enter selects. Shift+Enter extends the current range to the
          focused period. In the calendar, press Enter on a first day and then on a last day.
        </p>
      </PopoverPanel>
    </Popover>
  );
};

export default DateRangePicker;
