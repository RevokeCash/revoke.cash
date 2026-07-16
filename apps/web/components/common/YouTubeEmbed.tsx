'use client';

import LiteYouTubeEmbed from 'react-lite-youtube-embed';

const YouTubeEmbed = (props: any) => {
  return (
    <div className="my-5 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <LiteYouTubeEmbed poster="maxresdefault" {...props} />
    </div>
  );
};

export default YouTubeEmbed;
