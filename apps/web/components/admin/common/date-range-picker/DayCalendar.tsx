'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  addDays,
  addMonths,
  clampDate,
  type DateRange,
  EARLIEST_DATE,
  formatDayRange,
  formatPeriodName,
  getCalendarWeeks,
  getIsoWeek,
  getPeriod,
  isRangeInside,
  isSelectableRange,
  minDate,
  WEEKDAY_LONG_NAMES,
  WEEKDAY_SHORT_NAMES,
} from 'lib/admin/date-range';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import DayCalendarDay from './DayCalendarDay';
import type { PeriodSelection } from './usePeriodSelection';

interface Props {
  value: DateRange;
  today: string;
  selection: PeriodSelection;
}

const navigationButtonClassName = twMerge(
  'grid size-7 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900',
  'disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent dark:disabled:text-zinc-700',
  'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white',
);

const headCellClassName = 'pb-1 text-xs font-normal text-zinc-500 dark:text-zinc-500';

// One month with clickable ISO week numbers. The grid is a single tab stop, and the arrow keys move between days.
const DayCalendar = ({ value, today, selection }: Props) => {
  const initialDate = minDate(value.to, today);
  const [visibleMonth, setVisibleMonth] = useState(() => getPeriod('month', initialDate).from);
  const [focusedDate, setFocusedDate] = useState(initialDate);
  const isKeyboardMoveRef = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);
  const titleId = useId();

  const tabStopDate = getPeriod('month', focusedDate).from === visibleMonth ? focusedDate : visibleMonth;

  // Only a key move takes focus, so opening the panel or clicking a day does not
  useEffect(() => {
    if (!isKeyboardMoveRef.current) return;
    isKeyboardMoveRef.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${focusedDate}"]`)?.focus();
  }, [focusedDate]);

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    // Only keys on a day are handled here, so a focused week number keeps its native Enter and Shift+Enter
    if (!(event.target as HTMLElement).dataset.date) return;

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      selection.activatePeriod(getPeriod('day', focusedDate), true);
      return;
    }

    const target = getKeyboardTarget(event, focusedDate);
    if (!target) return;

    event.preventDefault();
    const clampedTarget = clampDate(target, EARLIEST_DATE, today);
    if (clampedTarget === focusedDate) return;

    isKeyboardMoveRef.current = true;
    setFocusedDate(clampedTarget);
    setVisibleMonth(getPeriod('month', clampedTarget).from);
  };

  return (
    <div className="border-t border-zinc-200 pt-3 md:w-72 md:shrink-0 md:border-t-0 md:border-l md:pt-0 md:pl-4 dark:border-zinc-800">
      <div className="flex h-8 items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={visibleMonth <= EARLIEST_DATE}
          onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          className={navigationButtonClassName}
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <span id={titleId} className="text-sm font-medium">
          {formatPeriodName(getPeriod('month', visibleMonth))}
        </span>
        <button
          type="button"
          aria-label="Next month"
          disabled={visibleMonth >= getPeriod('month', today).from}
          onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          className={navigationButtonClassName}
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
      <table
        ref={gridRef}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the grid role passes arrow keys to the day navigation
        role="grid"
        aria-labelledby={titleId}
        className="w-full table-fixed border-collapse"
        onKeyDown={onKeyDown}
        onPointerLeave={selection.leavePeriods}
      >
        <thead>
          <tr>
            <th scope="col" abbr="Week number" className={headCellClassName}>
              Wk
            </th>
            {WEEKDAY_SHORT_NAMES.map((weekdayName, index) => (
              <th key={weekdayName} scope="col" abbr={WEEKDAY_LONG_NAMES[index]} className={headCellClassName}>
                {weekdayName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getCalendarWeeks(visibleMonth).map((days) => {
            const week = getPeriod('week', days[0]);
            const isSolidWeek = selection.display.shape.unit === 'week' && isRangeInside(week, selection.display.range);

            return (
              <tr
                key={week.from}
                className="has-[[data-week-number]:enabled:hover]:bg-zinc-100 dark:has-[[data-week-number]:enabled:hover]:bg-zinc-900"
              >
                <th scope="row" className="p-0">
                  <button
                    type="button"
                    data-week-number
                    tabIndex={-1}
                    aria-label={`${formatPeriodName(week)} (${formatDayRange(week)})`}
                    disabled={!isSelectableRange(week, today)}
                    onClick={(event) => selection.activatePeriod(week, event.shiftKey)}
                    onPointerEnter={(event) => selection.enterPeriod(week, event.shiftKey)}
                    onFocus={() => selection.enterPeriod(week, false)}
                    className={twMerge(
                      'mx-auto grid size-9 place-items-center rounded-md text-xs font-normal text-zinc-500 md:size-8 dark:text-zinc-400',
                      'disabled:cursor-not-allowed disabled:text-zinc-300 dark:disabled:text-zinc-700',
                      'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white',
                      isSolidWeek &&
                        (selection.display.isPreview
                          ? 'font-medium ring-2 ring-brand ring-inset'
                          : 'bg-brand font-medium text-black dark:text-black'),
                    )}
                  >
                    {getIsoWeek(week.from).week}
                  </button>
                </th>
                {days.map((date) => (
                  <DayCalendarDay
                    key={date}
                    date={date}
                    visibleMonth={visibleMonth}
                    today={today}
                    selection={selection}
                    isFocusTarget={date === tabStopDate}
                    onFocus={setFocusedDate}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const getKeyboardTarget = (event: KeyboardEvent, focusedDate: string): string | null => {
  switch (event.key) {
    case 'ArrowLeft':
      return addDays(focusedDate, -1);
    case 'ArrowRight':
      return addDays(focusedDate, 1);
    case 'ArrowUp':
      return addDays(focusedDate, -7);
    case 'ArrowDown':
      return addDays(focusedDate, 7);
    case 'PageUp':
      return addMonths(focusedDate, event.shiftKey ? -12 : -1);
    case 'PageDown':
      return addMonths(focusedDate, event.shiftKey ? 12 : 1);
    case 'Home':
      return getPeriod('week', focusedDate).from;
    case 'End':
      return getPeriod('week', focusedDate).to;
    default:
      return null;
  }
};

export default DayCalendar;
