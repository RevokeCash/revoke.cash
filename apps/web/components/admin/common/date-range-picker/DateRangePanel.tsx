'use client';

import { useClose } from '@headlessui/react';
import { type DateRange, inferRangeShape, isSameRange } from 'lib/admin/date-range';
import { useEffect, useRef } from 'react';
import DayCalendar from './DayCalendar';
import PeriodMap from './PeriodMap';
import QuickRangeChips from './QuickRangeChips';
import RangeReadout from './RangeReadout';
import { usePeriodSelection } from './usePeriodSelection';

interface Props {
  value: DateRange;
  today: string;
  onChange: (range: DateRange) => void;
}

const DateRangePanel = ({ value, today, onChange }: Props) => {
  const close = useClose();
  const panelRef = useRef<HTMLDivElement>(null);

  // Every complete pick commits and closes the popover
  const select = (range: DateRange) => {
    if (!isSameRange(range, value)) onChange({ from: range.from, to: range.to });
    close();
  };

  const selection = usePeriodSelection({ value, today, onSelect: select });

  // The panel is not positioned yet on mount, so focusing must not scroll the page.
  // Focus starts on the element that shows the value: its chip, its map cell, or its last day in the calendar.
  // These are Headless UI Buttons, which only show a focus ring after keyboard use (unlike :focus-visible).
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the value at open time matters
  useEffect(() => {
    const { unit } = inferRangeShape(value);
    const isMapShape = unit === 'year' || unit === 'quarter' || unit === 'month';
    const tabStopSelector = isMapShape ? '[data-unit][tabindex="0"]' : '[data-date][tabindex="0"]';
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>('[data-quick-range][aria-pressed="true"]') ??
      panel?.querySelector<HTMLElement>(tabStopSelector);
    target?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={panelRef}>
      <div className="p-4 pb-3">
        <RangeReadout
          range={selection.display.range}
          isPreview={selection.display.isPreview}
          pendingStart={selection.pendingStart}
          today={today}
        />
      </div>
      <div className="flex flex-col gap-4 border-t border-zinc-200 p-3 md:flex-row md:p-4 dark:border-zinc-800">
        <div className="flex min-w-0 flex-col gap-4 md:flex-1">
          <PeriodMap value={value} today={today} selection={selection} />
          <QuickRangeChips value={value} today={today} onSelect={select} onPreview={selection.setChipPreview} />
        </div>
        <DayCalendar value={value} today={today} selection={selection} />
      </div>
      <p className="hidden border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500 pointer-fine:block dark:border-zinc-800 dark:text-zinc-500">
        Drag across periods or shift-click to span several. Click a day, then an end day or period.
      </p>
    </div>
  );
};

export default DateRangePanel;
