'use client';

import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import NoticeBanner from 'components/common/NoticeBanner';
import { usePremiumEntitlements } from 'lib/hooks/premium/usePremiumEntitlements';
import { useTranslations } from 'next-intl';
import { useConnection } from 'wagmi';

const ActiveSubscriptionBanner = () => {
  const t = useTranslations();
  const { address: account } = useConnection();
  const { isPremium, isUltimate } = usePremiumEntitlements(account);

  if (!isPremium) return null;

  const tierKey = isUltimate ? 'ultimate' : 'premium';

  return (
    <NoticeBanner
      style="info"
      icon={CheckBadgeIcon}
      action={
        <Button style="primary" size="sm" href="/account" router>
          {t('premium.pricing.subscriber_banner.manage_button')}
        </Button>
      }
    >
      {t('premium.pricing.subscriber_banner.description', { tier: t(`premium.pricing.tiers.${tierKey}.name`) })}
    </NoticeBanner>
  );
};

export default ActiveSubscriptionBanner;
