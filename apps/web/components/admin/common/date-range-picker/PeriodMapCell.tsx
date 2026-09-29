'use client';

import { Button as HeadlessButton } from '@headlessui/react';
import {
  formatPeriodName,
  getPeriod,
  getPeriodOverlap,
  isRangeInside,
  isSelectableRange,
  type Period,
} from 'lib/admin/date-range';
import { twMerge } from 'tailwind-merge';
import type { PeriodSelection } from './usePeriodSelection';

interface Props {
  period: Period;
  label: string;
  today: string;
  selection: PeriodSelection;
  isFocusTarget: boolean;
  onFocus: (period: Period) => void;
  className?: string;
}

const PeriodMapCell = ({ period, label, today, selection, isFocusTarget, onFocus, className }: Props) => {
  const { display } = selection;
  const isSolid = period.unit === display.shape.unit && isRangeInside(period, display.range);
  // Each quarter and month cell draws its own slice of the band, and the slices join up across cells
  const bandSlice = period.unit !== 'year' && !isSolid ? getPeriodOverlap(period, display.coveredRange) : null;
  const isCurrentMonth = period.unit === 'month' && period.from === getPeriod('month', today).from;

  return (
    <HeadlessButton
      data-unit={period.unit}
      data-from={period.from}
      aria-label={formatPeriodName(period)}
      aria-pressed={isSolid && !display.isPreview}
      aria-current={isCurrentMonth ? 'date' : undefined}
      tabIndex={isFocusTarget ? 0 : -1}
      disabled={!isSelectableRange(period, today)}
      onClick={(event) => selection.activatePeriod(period, event.shiftKey)}
      onPointerDown={(event) => selection.pressPeriod(period, event)}
      onPointerEnter={(event) => selection.enterPeriod(period, event.shiftKey)}
      onFocus={() => {
        onFocus(period);
        selection.enterPeriod(period, false);
      }}
      className={twMerge(
        'relative isolate flex items-center justify-center text-xs tabular-nums text-zinc-700 dark:text-zinc-300',
        'transition-colors duration-100 hover:bg-zinc-100 dark:hover:bg-zinc-900',
        'outline-hidden data-focus:ring-2 data-focus:ring-inset data-focus:ring-black dark:data-focus:ring-white',
        'disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent dark:disabled:text-zinc-700',
        className,
        isSolid &&
          (display.isPreview
            ? 'font-medium ring-2 ring-brand ring-inset'
            : 'bg-brand font-medium text-black hover:bg-brand dark:text-black dark:hover:bg-brand'),
      )}
    >
      {bandSlice && (
        // A press previews this cell as solid, which removes the slice. A click that starts on a removed element
        // never fires, so the slice must not take the press.
        <span
          aria-hidden
          className={twMerge(
            'pointer-events-none absolute inset-y-0 -z-10 transition-[left,right] duration-100',
            display.isPreview ? 'bg-brand/15 dark:bg-brand/10' : 'bg-brand/25 dark:bg-brand/20',
            // Edge lines only sit on cell borders, so they never cross a label. A range that starts or ends inside a
            // cell shows its tint alone.
            display.coveredRange.from === period.from && 'border-l-2 border-brand',
            display.coveredRange.to === period.to && 'border-r-2 border-brand',
          )}
          style={{ left: `${bandSlice.start * 100}%`, right: `${(1 - bandSlice.end) * 100}%` }}
        />
      )}
      {label}
      {isCurrentMonth && (
        <span aria-hidden className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current" />
      )}
    </HeadlessButton>
  );
};

export default PeriodMapCell;
