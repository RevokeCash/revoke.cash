'use client';

import analytics from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import AnnouncementBanner from './AnnouncementBanner';
import Button from './Button';
import RichText from './RichText';

const AnnouncementsContainer = () => {
  const t = useTranslations();

  return (
    <AnnouncementBanner storageKey="introducing-revoke-premium-and-ultimate">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="text-center">
          <RichText>{(tags) => t.rich('common.announcements.premium_launch.text', tags)}</RichText>
        </div>
        <div className="flex items-center gap-2">
          <Button
            style="primary"
            size="sm"
            href="/premium"
            router
            onClick={() =>
              analytics.track('Announcement Banner Action', {
                action: 'primary-cta',
                storageKey: 'introducing-revoke-premium-and-ultimate',
              })
            }
            className="bg-black text-white dark:bg-black dark:text-white dark:visited:text-white border-black dark:border-black dark:hover:bg-zinc-800"
          >
            {t('common.announcements.premium_launch.view_pricing')}
          </Button>
          <Button
            style="secondary"
            size="sm"
            href="/blog/2026/introducing-revoke-premium-and-ultimate"
            router
            onClick={() =>
              analytics.track('Announcement Banner Action', {
                action: 'secondary-cta',
                storageKey: 'introducing-revoke-premium-and-ultimate',
              })
            }
            className="border-none bg-brand dark:bg-brand text-black dark:text-black dark:visited:text-black hover:bg-black/10 dark:hover:bg-black/10"
          >
            {t('common.announcements.premium_launch.learn_more')}
          </Button>
        </div>
      </div>
    </AnnouncementBanner>
  );
};

export default AnnouncementsContainer;
