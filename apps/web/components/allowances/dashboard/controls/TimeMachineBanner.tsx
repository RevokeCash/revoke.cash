'use client';

import { formatTimestamp } from '@revoke.cash/core/utils/time';
import Button from 'components/common/Button';
import { useTimeMachine } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { useTranslations } from 'next-intl';

const TimeMachineBanner = () => {
  const t = useTranslations();
  const { isActive, timestamp, setTimestamp } = useTimeMachine();

  if (!isActive || !timestamp) return null;

  const { formattedDate, formattedTime } = formatTimestamp(timestamp);

  return (
    <div className="flex items-center justify-between w-full border border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950 rounded-lg px-4 py-2">
      <span className="text-sm text-amber-700 dark:text-amber-400">
        {t('address.time_machine.viewing_as_of', {
          date: formattedDate,
          time: formattedTime,
        })}
      </span>
      <Button size="sm" style="tertiary" onClick={() => setTimestamp(undefined)} className="text-sm">
        {t('address.time_machine.exit')}
      </Button>
    </div>
  );
};

export default TimeMachineBanner;
