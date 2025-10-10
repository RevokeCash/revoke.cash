'use client';

import AnnouncementBanner from './AnnouncementBanner';
import Button from './Button';

const AnnouncementsContainer = () => {
  return (
    <AnnouncementBanner storageKey="banner:2025-10-10-00">
      <span>Why we're introducing batch revoke fees: </span>
      <Button
        style="secondary"
        size="sm"
        href="/blog/2025/introducing-batch-revoke-fee"
        router
        className="bg-transparent hover:bg-black/20 dark:border-black dark:text-zinc-900"
      >
        Learn more
      </Button>
    </AnnouncementBanner>
  );
};

export default AnnouncementsContainer;
