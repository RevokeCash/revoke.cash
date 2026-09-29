'use client';

import { Button as HeadlessButton } from '@headlessui/react';
import { formatLongDay, getPeriod, isRangeInside, isSelectableRange } from 'lib/admin/date-range';
import { twMerge } from 'tailwind-merge';
import type { PeriodSelection } from './usePeriodSelection';

interface Props {
  date: string;
  visibleMonth: string;
  today: string;
  selection: PeriodSelection;
  isFocusTarget: boolean;
  onFocus: (date: string) => void;
}

const DayCalendarDay = ({ date, visibleMonth, today, selection, isFocusTarget, onFocus }: Props) => {
  const { display, pendingStart } = selection;
  const period = getPeriod('day', date);
  const isInCoveredRange = isRangeInside(period, display.coveredRange);
  const isEndpoint = date === display.range.from || date === display.coveredRange.to || date === pendingStart;
  const isToday = date === today;

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: cells of a role="grid" table are gridcells, which support aria-selected
    <td
      aria-selected={isInCoveredRange}
      // The band sits on the cells, so it runs on without gaps between the days
      className={twMerge(
        'p-0',
        isInCoveredRange && (display.isPreview ? 'bg-brand/15 dark:bg-brand/10' : 'bg-brand/25 dark:bg-brand/20'),
      )}
    >
      <HeadlessButton
        data-date={date}
        aria-label={isToday ? `${formatLongDay(date)}, today` : formatLongDay(date)}
        aria-current={isToday ? 'date' : undefined}
        tabIndex={isFocusTarget ? 0 : -1}
        disabled={!isSelectableRange(period, today)}
        onClick={(event) => selection.activatePeriod(period, event.shiftKey)}
        onPointerEnter={(event) => selection.enterPeriod(period, event.shiftKey)}
        onFocus={() => {
          onFocus(date);
          selection.enterPeriod(period, false);
        }}
        className={twMerge(
          'relative mx-auto grid size-9 place-items-center rounded-md text-sm tabular-nums md:size-8',
          'hover:bg-zinc-100 dark:hover:bg-zinc-900',
          'outline-hidden data-focus:ring-2 data-focus:ring-inset data-focus:ring-black dark:data-focus:ring-white',
          'disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent dark:disabled:text-zinc-700',
          getPeriod('month', date).from !== visibleMonth && 'text-zinc-400 dark:text-zinc-500',
          isEndpoint &&
            (display.isPreview
              ? 'ring-2 ring-brand ring-inset hover:bg-transparent dark:hover:bg-transparent'
              : 'bg-brand font-medium text-black hover:bg-brand dark:text-black dark:hover:bg-brand'),
          isToday && 'font-semibold',
        )}
      >
        {Number(date.slice(8))}
        {isToday && (
          <span aria-hidden className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current" />
        )}
      </HeadlessButton>
    </td>
  );
};

export default DayCalendarDay;
