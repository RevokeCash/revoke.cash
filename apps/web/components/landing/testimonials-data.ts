export interface Testimonial {
  name: string;
  handle: string;
  avatar: string;
  tweetUrl: string;
  quoteKey: string;
}

// Quotes are resolved from translations in a server component and passed down to the client carousel
export interface TranslatedTestimonial extends Testimonial {
  quote: string;
}

// Real quotes from the community — replace with curated tweets before launch
// Quote texts live in locales/*/landing.json under testimonials.quotes, keyed by quoteKey
export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Beau • Pudgy Penguins',
    handle: '@beausecurity',
    avatar: 'https://pbs.twimg.com/profile_images/1970575702584864768/1eNZddVS_400x400.jpg',
    tweetUrl: 'https://x.com/beausecurity/status/2009454611065917624',
    quoteKey: 'beausecurity',
  },
  {
    name: 'NFT Drew',
    handle: '@nft_dreww',
    avatar: 'https://pbs.twimg.com/profile_images/1589726471249174536/pEqaw6FO_400x400.png',
    tweetUrl: 'https://x.com/nft_dreww/status/2011068448957251836',
    quoteKey: 'nft_dreww',
  },
  // {
  //   name: 'Brittany • Espresso',
  //   handle: '@BrittanyMadruga',
  //   avatar: 'https://pbs.twimg.com/profile_images/1985756487390806016/uD_19tiq_400x400.jpg',
  //   tweetUrl: 'https://x.com/BrittanyMadruga/status/2000270136243364121',
  //   quoteKey: 'brittanymadruga',
  //   (quote: "Tell your friends about Revoke.cash. Even if they've been around forever.")
  // },
  {
    name: 'Rahul • Safe',
    handle: '@rsquare',
    avatar: 'https://pbs.twimg.com/profile_images/2015533934407204864/7RmMDhOm_400x400.jpg',
    tweetUrl: 'https://x.com/rsquare/status/2044370940314694018',
    quoteKey: 'rsquare',
  },
];
