'use client';

import { DAY } from '@revoke.cash/core/utils/time';
import Button from 'components/common/Button';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import { useConnection } from 'wagmi';

const EXPIRY_NOTICE_DAYS = 30;

const SubscriptionExpiryNotice = () => {
  const isMounted = useMounted();
  const t = useTranslations();
  const { address, premiumEndsAt } = useAddress();
  const { address: account } = useConnection();

  if (!isMounted || !premiumEndsAt || address !== account) return null;

  const daysUntilExpiry = Math.ceil((new Date(premiumEndsAt).getTime() - Date.now()) / DAY);
  if (daysUntilExpiry > EXPIRY_NOTICE_DAYS || daysUntilExpiry <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3">
      <span className="text-sm">{t('address.premium.subscription_expiry.description', { days: daysUntilExpiry })}</span>
      <Button style="secondary" size="sm" href="/account" router>
        {t('address.premium.subscription_expiry.cta')}
      </Button>
    </div>
  );
};

export default SubscriptionExpiryNotice;
