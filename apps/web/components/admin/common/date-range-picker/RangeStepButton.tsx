'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { type DateRange, formatRangeLabel, isSelectableRange, stepRange } from 'lib/admin/date-range';
import { twMerge } from 'tailwind-merge';

interface Props {
  direction: -1 | 1;
  value: DateRange;
  today: string;
  onChange: (range: DateRange) => void;
}

// Steps to the previous or next period of the same size, without opening the popover
const RangeStepButton = ({ direction, value, today, onChange }: Props) => {
  const target = stepRange(value, direction);
  const isDisabled = !isSelectableRange(target, today);
  const directionName = direction === -1 ? 'Previous' : 'Next';
  const description = `${directionName}: ${formatRangeLabel(target, today)}`;
  const Icon = direction === -1 ? ChevronLeftIcon : ChevronRightIcon;

  const button = (
    <button
      type="button"
      disabled={isDisabled}
      aria-label={isDisabled ? `${directionName} period` : description}
      onClick={() => onChange(target)}
      className={twMerge(
        'grid w-6 place-items-center hover:bg-zinc-200 dark:hover:bg-zinc-800',
        'disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent dark:disabled:text-zinc-700',
        'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white',
        direction === 1 && 'rounded-r-md',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );

  if (isDisabled) return button;

  return <WithHoverTooltip tooltip={description}>{button}</WithHoverTooltip>;
};

export default RangeStepButton;
