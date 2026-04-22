'use client';

import { formatTimestamp } from '@revoke.cash/core/utils/time';
import { useTranslations } from 'next-intl';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

const DateTimeSlider = ({ value, onChange, min, max }: Props) => {
  const t = useTranslations();

  const isAtPresent = value >= max;
  const { formattedDate, formattedTime } = formatTimestamp(value);

  return (
    <div className="flex flex-col gap-1">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700 cursor-pointer accent-black dark:accent-white"
        aria-label={t('address.time_machine.label')}
      />
      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{formatTimestamp(min).formattedDate}</span>
        <span>{t('address.time_machine.now')}</span>
      </div>
      <div className="text-center font-medium text-sm text-zinc-800 dark:text-zinc-200 tabular-nums">
        {isAtPresent ? t('address.time_machine.now') : `${formattedDate}, ${formattedTime}`}
      </div>
    </div>
  );
};

export default DateTimeSlider;
