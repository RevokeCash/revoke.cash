'use client';

import { formatPeriodInYear, getPeriod, getPeriodsOfYear, type Period } from 'lib/admin/date-range';
import { twMerge } from 'tailwind-merge';
import PeriodMapCell from './PeriodMapCell';
import type { PeriodSelection } from './usePeriodSelection';

interface Props {
  year: number;
  today: string;
  selection: PeriodSelection;
  focusedPeriod: Period;
  onCellFocus: (period: Period) => void;
}

// A year button next to two half-year blocks of 2 quarters above 6 months. The blocks sit side by side on
// desktop and stack on mobile, so the lanes reflow from 12 columns to 6 without any JS.
const PeriodMapYear = ({ year, today, selection, focusedPeriod, onCellFocus }: Props) => {
  const quarters = getPeriodsOfYear('quarter', year);
  const months = getPeriodsOfYear('month', year);

  const renderCell = (period: Period, label: string, className: string) => {
    const isFocusTarget = period.unit === focusedPeriod.unit && period.from === focusedPeriod.from;

    return (
      <PeriodMapCell
        key={period.from}
        period={period}
        label={label}
        today={today}
        selection={selection}
        isFocusTarget={isFocusTarget}
        onFocus={onCellFocus}
        className={className}
      />
    );
  };

  return (
    <div className="flex gap-2">
      {renderCell(getPeriod('year', quarters[0].from), String(year), 'w-10 shrink-0 rounded-md font-medium')}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-200 md:flex-row dark:border-zinc-800">
        {[0, 1].map((half) => (
          <div
            key={half}
            className={twMerge(
              'grid flex-1 grid-cols-6',
              half === 1 && 'border-t border-zinc-200 md:border-t-0 md:border-l dark:border-zinc-800',
            )}
          >
            {quarters
              .slice(half * 2, half * 2 + 2)
              .map((quarter, index) =>
                renderCell(
                  quarter,
                  formatPeriodInYear(quarter),
                  twMerge(
                    'col-span-3 h-7 border-b border-zinc-200 md:h-6 dark:border-zinc-800',
                    index === 1 && 'border-l',
                  ),
                ),
              )}
            {months.slice(half * 6, half * 6 + 6).map((month, index) =>
              renderCell(
                month,
                formatPeriodInYear(month),
                twMerge(
                  'h-9 md:h-8',
                  index > 0 && 'border-l',
                  // Quarter boundaries get the stronger line
                  index === 3 ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-900',
                ),
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeriodMapYear;
