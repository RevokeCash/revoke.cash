'use client';

import AnnouncementBanner from './AnnouncementBanner';
import Button from './Button';

const AnnouncementsContainer = () => {
  return (
    <AnnouncementBanner storageKey="revoke-extension-update">
      Revoke x Fairside: The Next Chapter for the Revoke.cash Extension{' '}
      <Button
        style="secondary"
        size="sm"
        href="/blog/2026/revoke-extension-update"
        router
        className="bg-brand text-black dark:text-black border-black dark:border-black hover:bg-black/10 dark:hover:bg-black/10"
      >
        Learn More
      </Button>
    </AnnouncementBanner>
  );
};

export default AnnouncementsContainer;
