'use client';

import { getChainName } from '@revoke.cash/core/chains';
import Button from 'components/common/Button';
import NoticeBanner from 'components/common/NoticeBanner';
import { trackAutoRevokeNoticeAction } from 'lib/utils/auto-revoke-notice';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import type { Address } from 'viem';

interface Props {
  account: Address;
  chainIds: number[];
}

const AutoRevokeUpgradeBanner = ({ account, chainIds }: Props) => {
  const t = useTranslations();
  const format = useFormatter();

  const track = (action: 'view' | 'click') => {
    trackAutoRevokeNoticeAction({ action, notice: 'upgrade_needed', location: 'dashboard', account, chainIds });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: A view is tracked once per mount
  useEffect(() => {
    track('view');
  }, []);

  return (
    <NoticeBanner
      style="warning"
      action={
        <Button style="secondary" size="sm" href="/account/auto-revoke" router onClick={() => track('click')}>
          {t('address.premium.auto_revoke_upgrade.cta')}
        </Button>
      }
    >
      {t('address.premium.auto_revoke_upgrade.description', { chains: format.list(chainIds.map(getChainName)) })}
    </NoticeBanner>
  );
};

export default AutoRevokeUpgradeBanner;
