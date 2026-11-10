'use client';

import { getChainName, ORDERED_CHAINS } from '@revoke.cash/core/chains';
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

// A wallet can need the upgrade on every supported chain, so longer lists end with "N more" to keep the notice short
const MAX_LISTED_CHAINS = 3;

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

  const chainNames = [...chainIds]
    .sort((first, second) => ORDERED_CHAINS.indexOf(first) - ORDERED_CHAINS.indexOf(second))
    .map(getChainName);
  const hiddenChainCount = chainNames.length - MAX_LISTED_CHAINS;
  const listedChains =
    hiddenChainCount > 1
      ? [
          ...chainNames.slice(0, MAX_LISTED_CHAINS),
          t('address.premium.auto_revoke_upgrade.more_chains', { count: hiddenChainCount }),
        ]
      : chainNames;

  return (
    <NoticeBanner
      style="warning"
      action={
        <Button style="secondary" size="sm" href="/account/auto-revoke" router onClick={() => track('click')}>
          {t('address.premium.auto_revoke_upgrade.cta')}
        </Button>
      }
    >
      {t('address.premium.auto_revoke_upgrade.description', {
        chains: format.list(listedChains),
        count: chainIds.length,
      })}
    </NoticeBanner>
  );
};

export default AutoRevokeUpgradeBanner;
