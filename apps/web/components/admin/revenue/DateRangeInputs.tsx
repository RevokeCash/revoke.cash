'use client';

import Input from 'components/common/Input';

export const currentUtcYearStart = (): string => `${new Date().getUTCFullYear()}-01-01`;
export const currentUtcDate = (): string => new Date().toISOString().slice(0, 10);

interface Props {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

const DateRangeInputs = ({ from, to, onFromChange, onToChange }: Props) => (
  <div className="flex items-center gap-2">
    <Input
      size="sm"
      type="date"
      value={from}
      onChange={(event) => onFromChange(event.target.value)}
      aria-label="From date"
    />
    <span className="text-sm text-zinc-500">to</span>
    <Input size="sm" type="date" value={to} onChange={(event) => onToChange(event.target.value)} aria-label="To date" />
  </div>
);

export default DateRangeInputs;
