'use client';

import { Dialog } from '@headlessui/react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { isNullish } from '@revoke.cash/core/utils';
import { SECOND } from '@revoke.cash/core/utils/time';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useTimeMachine } from 'lib/hooks/page-context/TimeMachineContext';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DateTimeSlider from './DateTimeSlider';

const TimeMachineModalWithButton = () => {
  const t = useTranslations();
  const { timestamp, setTimestamp, isActive, isLoading, oldestEventTimestamp } = useTimeMachine();
  const [open, setOpen] = useState(false);

  const hasEvents = !isNullish(oldestEventTimestamp);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only recalculate when modal opens
  const maxSeconds = useMemo(() => Math.floor(Date.now() / SECOND), [open]);
  const minSeconds = oldestEventTimestamp ?? maxSeconds;

  const [localValue, setLocalValue] = useState<number>(timestamp ?? maxSeconds);

  useEffect(() => {
    if (open) {
      setLocalValue(timestamp ?? maxSeconds);
    }
  }, [open, timestamp, maxSeconds]);

  const handleApply = useCallback(() => {
    setTimestamp(localValue >= maxSeconds ? undefined : localValue);
    setOpen(false);
  }, [localValue, maxSeconds, setTimestamp]);

  const handleBackToPresent = useCallback(() => {
    setTimestamp(undefined);
    setOpen(false);
  }, [setTimestamp]);

  return (
    <>
      <Button
        size="md"
        style="secondary"
        onClick={() => setOpen(true)}
        disabled={isLoading || !hasEvents}
        className="h-9 px-4 text-sm gap-1.5 justify-center w-full sm:w-40"
      >
        <ClockIcon className="w-4 h-4" />
        {t('address.time_machine.label')}
      </Button>
      <Modal open={open} setOpen={setOpen} className="sm:max-w-lg">
        <div className="flex flex-col gap-4">
          <div>
            <Dialog.Title className="text-lg font-bold">{t('address.time_machine.label')}</Dialog.Title>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t('address.time_machine.description')}</p>
          </div>
          <DateTimeSlider value={localValue} onChange={setLocalValue} min={minSeconds} max={maxSeconds} />
          <div className="flex justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {isActive ? (
              <Button size="md" style="tertiary" onClick={handleBackToPresent} className="text-sm">
                {t('address.time_machine.exit')}
              </Button>
            ) : (
              <div />
            )}
            <Button size="md" style="primary" onClick={handleApply} className="text-sm">
              {t('address.time_machine.apply')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TimeMachineModalWithButton;
