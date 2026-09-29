'use client';

import {
  addMonths,
  type DateRange,
  getPeriod,
  getPeriodMapYears,
  inferRangeShape,
  minDate,
  type Period,
  shiftPeriod,
} from 'lib/admin/date-range';
import { type KeyboardEvent, useRef, useState } from 'react';
import PeriodMapYear from './PeriodMapYear';
import type { PeriodSelection } from './usePeriodSelection';

interface Props {
  value: DateRange;
  today: string;
  selection: PeriodSelection;
}

// One row per year with a year button, a quarter lane and a month lane. The map is a single tab stop,
// and the arrow keys move focus between its cells.
const PeriodMap = ({ value, today, selection }: Props) => {
  const mapRef = useRef<HTMLFieldSetElement>(null);
  const [focusedPeriod, setFocusedPeriod] = useState(() => getInitialFocusedPeriod(value, today));

  const onKeyDown = (event: KeyboardEvent<HTMLFieldSetElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      selection.activatePeriod(focusedPeriod, true);
      return;
    }

    const target = getKeyboardTarget(event.key, focusedPeriod, today);
    if (!target) return;

    event.preventDefault();
    // Future cells are disabled and years before the map are not rendered, so focusing them does nothing
    mapRef.current?.querySelector<HTMLElement>(`[data-unit="${target.unit}"][data-from="${target.from}"]`)?.focus();
  };

  return (
    <fieldset
      ref={mapRef}
      aria-label="Years, quarters and months"
      className="flex min-w-0 select-none flex-col gap-2"
      onPointerLeave={selection.leavePeriods}
      onKeyDown={onKeyDown}
    >
      {getPeriodMapYears(value, today).map((year) => (
        <PeriodMapYear
          key={year}
          year={year}
          today={today}
          selection={selection}
          focusedPeriod={focusedPeriod}
          onCellFocus={setFocusedPeriod}
        />
      ))}
    </fieldset>
  );
};

const getInitialFocusedPeriod = (value: DateRange, today: string): Period => {
  const { unit } = inferRangeShape(value);
  if (unit === 'year' || unit === 'quarter' || unit === 'month') return getPeriod(unit, value.from);
  return getPeriod('month', minDate(value.to, today));
};

const getKeyboardTarget = (key: string, focusedPeriod: Period, today: string): Period | null => {
  const { unit, from } = focusedPeriod;
  const year = getPeriod('year', from);

  switch (key) {
    case 'ArrowLeft':
      return shiftPeriod(focusedPeriod, -1);
    case 'ArrowRight':
      return shiftPeriod(focusedPeriod, 1);
    case 'ArrowUp':
      if (unit === 'month') return getPeriod('quarter', from);
      if (unit === 'quarter') return year;
      return null;
    // Zooming in goes to the latest child that has started, so 2026 goes to Q3 and then to Sep
    case 'ArrowDown':
      if (unit === 'year') return getPeriod('quarter', minDate(focusedPeriod.to, today));
      if (unit === 'quarter') return getPeriod('month', minDate(focusedPeriod.to, today));
      return null;
    case 'PageUp':
      return getPeriod(unit, addMonths(from, -12));
    case 'PageDown':
      return getPeriod(unit, addMonths(from, 12));
    case 'Home':
      return getPeriod(unit, year.from);
    case 'End':
      return getPeriod(unit, minDate(year.to, today));
    default:
      return null;
  }
};

export default PeriodMap;
