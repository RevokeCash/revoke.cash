'use client';

import LiteYouTubeEmbed from 'react-lite-youtube-embed';

const YouTubeEmbed = (props: any) => {
  return (
    <div className="my-5 border border-black dark:border-white rounded-lg overflow-hidden">
      <LiteYouTubeEmbed poster="maxresdefault" {...props} />
    </div>
  );
};

export default YouTubeEmbed;
