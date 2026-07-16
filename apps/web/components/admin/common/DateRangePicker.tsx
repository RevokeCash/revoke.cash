'use client';

import Input from 'components/common/Input';
import Select from 'components/common/select/Select';

export const currentUtcYearStart = (): string => `${new Date().getUTCFullYear()}-01-01`;
export const currentUtcDate = (): string => new Date().toISOString().slice(0, 10);

interface PresetOption {
  value: string;
  label: string;
  from: string;
  to: string;
}

interface Props {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

const DateRangePicker = ({ from, to, onFromChange, onToChange }: Props) => {
  const monthOptions = buildMonthOptions();
  const quarterOptions = buildQuarterOptions();

  const presetGroups = [
    { label: 'Quarters', options: quarterOptions },
    { label: 'Months', options: monthOptions },
  ];

  const selectedPreset =
    [...monthOptions, ...quarterOptions].find((option) => option.from === from && option.to === to) ?? null;

  const onPresetChange = (option: PresetOption) => {
    onFromChange(option.from);
    onToChange(option.to);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        size="sm"
        aria-label="Select month or quarter"
        placeholder="Custom range"
        options={presetGroups}
        value={selectedPreset}
        onChange={onPresetChange}
      />
      <div className="flex items-center gap-2">
        <Input
          size="sm"
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
          aria-label="From date"
        />
        <span className="text-sm text-zinc-500">to</span>
        <Input
          size="sm"
          type="date"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
          aria-label="To date"
        />
      </div>
    </div>
  );
};

// Previous 12 completed calendar months (UTC), most recent first
const buildMonthOptions = (): PresetOption[] => {
  const now = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const monthsAgo = index + 1;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 0));

    return {
      value: `month-${toIsoDate(start)}`,
      label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      from: toIsoDate(start),
      to: toIsoDate(end),
    };
  });
};

// Previous 4 completed calendar quarters (UTC), most recent first
const buildQuarterOptions = (): PresetOption[] => {
  const now = new Date();
  const currentQuarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;

  return Array.from({ length: 4 }, (_, index) => {
    const quartersAgo = index + 1;
    const start = new Date(Date.UTC(now.getUTCFullYear(), currentQuarterStartMonth - quartersAgo * 3, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), currentQuarterStartMonth - (quartersAgo - 1) * 3, 0));

    return {
      value: `quarter-${toIsoDate(start)}`,
      label: `Q${Math.floor(start.getUTCMonth() / 3) + 1} ${start.getUTCFullYear()}`,
      from: toIsoDate(start),
      to: toIsoDate(end),
    };
  });
};

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export default DateRangePicker;
