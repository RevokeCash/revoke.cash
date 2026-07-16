'use client';

import {
  STALE_APPROVAL_THRESHOLD_MAX_DAYS,
  STALE_APPROVAL_THRESHOLD_MIN_DAYS,
} from '@revoke.cash/core/auto-revoke/config';
import Input from 'components/common/Input';
import useDebouncedCallback from 'lib/hooks/useDebouncedCallback';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const StaleApprovalDaysInput = ({ value, onChange, disabled = false }: Props) => {
  const t = useTranslations();

  const [inputValue, setInputValue] = useState(String(value));
  const [debouncedOnChange] = useDebouncedCallback(onChange, 500);

  // Sync the local input when the persisted value changes (e.g. after server reconciliation)
  useEffect(() => setInputValue(String(value)), [value]);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={STALE_APPROVAL_THRESHOLD_MIN_DAYS}
        max={STALE_APPROVAL_THRESHOLD_MAX_DAYS}
        value={inputValue}
        onChange={(event) => {
          const clamped = clampDays(event.target.value);
          if (String(clamped) !== inputValue) {
            setInputValue(String(clamped));
            debouncedOnChange(clamped);
          }
        }}
        disabled={disabled}
        className="w-20 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
      />
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('account.auto_revoke.rules.days')}</span>
    </div>
  );
};

export default StaleApprovalDaysInput;

const clampDays = (inputValue: string): number => {
  const parsed = Number.parseInt(inputValue, 10);
  if (!Number.isFinite(parsed)) return STALE_APPROVAL_THRESHOLD_MIN_DAYS;
  return Math.max(STALE_APPROVAL_THRESHOLD_MIN_DAYS, Math.min(STALE_APPROVAL_THRESHOLD_MAX_DAYS, parsed));
};
