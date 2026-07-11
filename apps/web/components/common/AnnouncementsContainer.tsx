'use client';

import analytics from 'lib/utils/analytics';
import AnnouncementBanner from './AnnouncementBanner';
import Button from './Button';

const AnnouncementsContainer = () => {
  return (
    <AnnouncementBanner storageKey="introducing-revoke-premium-and-ultimate">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="text-center">
          Introducing <strong>Revoke Premium &amp; Ultimate</strong>: Unified Multichain Dashboard &amp; Automated
          Revoking
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
            className="bg-black text-white dark:bg-black dark:text-white border-black dark:border-black dark:hover:bg-zinc-800"
          >
            View Pricing
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
            className="border-none bg-brand text-black dark:text-black border-black/10 dark:border-black/40 hover:bg-black/10 dark:hover:bg-black/10"
          >
            Learn More
          </Button>
        </div>
      </div>
    </AnnouncementBanner>
  );
};

export default AnnouncementsContainer;
