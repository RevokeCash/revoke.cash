'use client';

import NavigationTab from 'components/common/NavigationTab';
import NavigationTabs from 'components/common/NavigationTabs';
import { useAutoRevokeSetupNeeded } from 'lib/hooks/auto-revoke/useAutoRevokeSetupNeeded';
import { useTranslations } from 'next-intl';

const AccountNavigation = () => {
  const t = useTranslations();
  const { setupNeeded } = useAutoRevokeSetupNeeded();

  return (
    <NavigationTabs>
      <NavigationTab name={t('account.tabs.subscription')} href="/account" />
      <NavigationTab name={t('account.tabs.auto_revoke')} href="/account/auto-revoke" attention={setupNeeded} />
      <NavigationTab name={t('account.tabs.billing')} href="/account/billing" />
      <NavigationTab name={t('account.tabs.coverage')} href="/account/coverage" />
    </NavigationTabs>
  );
};

export default AccountNavigation;
