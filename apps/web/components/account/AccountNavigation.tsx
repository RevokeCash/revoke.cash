'use client';

import NavigationTab from 'components/common/NavigationTab';
import { useAutoRevokeSetupNeeded } from 'lib/hooks/auto-revoke/useAutoRevokeSetupNeeded';
import { useTranslations } from 'next-intl';

const AccountNavigation = () => {
  const t = useTranslations();
  const { setupNeeded } = useAutoRevokeSetupNeeded();

  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full border-b border-zinc-200 dark:border-zinc-800">
      <nav className="flex gap-4">
        <NavigationTab name={t('account.tabs.subscription')} href="/account/subscription" />
        <NavigationTab name={t('account.tabs.auto_revoke')} href="/account/auto-revoke" attention={setupNeeded} />
        <NavigationTab name={t('account.tabs.billing')} href="/account/billing" />
        <NavigationTab name={t('account.tabs.coverage')} href="/account/coverage" />
      </nav>
    </div>
  );
};

export default AccountNavigation;
