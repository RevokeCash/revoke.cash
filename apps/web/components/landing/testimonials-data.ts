export interface Testimonial {
  name: string;
  handle: string;
  avatar: string;
  tweetUrl: string;
  quote: string;
}

// Real quotes from the community — replace with curated tweets before launch
export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Beau • Pudgy Penguins',
    handle: '@beausecurity',
    avatar: 'https://pbs.twimg.com/profile_images/1970575702584864768/1eNZddVS_400x400.jpg',
    tweetUrl: 'https://x.com/beausecurity/status/2009454611065917624',
    quote: `Revoke old approvals to smart contracts you aren't using anymore.

It's well worth it. Use Revoke.cash.`,
  },
  {
    name: 'NFT Drew',
    handle: '@nft_dreww',
    avatar: 'https://pbs.twimg.com/profile_images/1589726471249174536/pEqaw6FO_400x400.png',
    tweetUrl: 'https://x.com/nft_dreww/status/2011068448957251836',
    quote:
      'We all have phones, set a reminder right now to visit Revoke.cash and check your approvals weekly. This takes 30 seconds and can prevent hackers from stealing your assets.',
  },
  // {
  //   name: 'Brittany • Espresso',
  //   handle: '@BrittanyMadruga',
  //   avatar: 'https://pbs.twimg.com/profile_images/1985756487390806016/uD_19tiq_400x400.jpg',
  //   tweetUrl: 'https://x.com/BrittanyMadruga/status/2000270136243364121',
  //   quote: "Tell your friends about Revoke.cash. Even if they've been around forever.",
  // },
  {
    name: 'Rahul • Safe',
    handle: '@rsquare',
    avatar: 'https://pbs.twimg.com/profile_images/2015533934407204864/7RmMDhOm_400x400.jpg',
    tweetUrl: 'https://x.com/rsquare/status/2044370940314694018',
    quote:
      'One of the best things you can do with Safe when it comes to reacting quickly to incidents is to conveniently revoke approvals with the Revoke.cash Safe App.',
  },
];
