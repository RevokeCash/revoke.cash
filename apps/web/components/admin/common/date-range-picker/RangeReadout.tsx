'use client';

import { type DateRange, formatDay, formatRangeDetail, formatRangeLabel } from 'lib/admin/date-range';
import { twMerge } from 'tailwind-merge';

interface Props {
  range: DateRange;
  isPreview: boolean;
  pendingStart: string | null;
  today: string;
}

const RangeReadout = ({ range, isPreview, pendingStart, today }: Props) => {
  const isPendingStartOnly = pendingStart !== null && range.from === pendingStart && range.to === pendingStart;

  return (
    <div aria-live="polite" aria-atomic="true" className="flex min-w-0 flex-col gap-1">
      <span
        className={twMerge(
          'text-sm font-medium',
          isPreview ? 'text-zinc-600 dark:text-zinc-400' : 'text-black dark:text-white',
        )}
      >
        {isPendingStartOnly ? `From ${formatDay(pendingStart)}` : formatRangeLabel(range, today)}
      </span>
      <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {isPendingStartOnly ? 'Pick an end day, or a week, month, quarter or year' : formatRangeDetail(range, today)}
      </span>
    </div>
  );
};

export default RangeReadout;
