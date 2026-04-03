'use client';

import { CHROME_EXTENSION_URL } from 'lib/constants';
import AnnouncementBanner from './AnnouncementBanner';
import Button from './Button';

const AnnouncementsContainer = () => {
  return (
    <AnnouncementBanner storageKey="revoke-extension-update">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="text-center">
          Revoke x Fairside: Major update to the Revoke Extension, get it now to see all the new features
        </div>
        <div className="flex items-center gap-2">
          <Button
            style="primary"
            size="sm"
            href={CHROME_EXTENSION_URL}
            external
            className="bg-black text-white dark:bg-black dark:text-white border-black dark:border-black dark:hover:bg-zinc-800"
          >
            Get the Extension
          </Button>
          <Button
            style="secondary"
            size="sm"
            href="/blog/2026/revoke-extension-update"
            router
            className="bg-brand text-black dark:text-black border-black/10 dark:border-black/40 hover:bg-black/10 dark:hover:bg-black/10"
          >
            Learn More
          </Button>
        </div>
      </div>
    </AnnouncementBanner>
  );
};

export default AnnouncementsContainer;
