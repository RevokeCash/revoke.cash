import type { NextSeoProps } from 'next-seo';

// For some reason next-seo's DefaultSeo isn't working, so I'll do it like this
export const defaultSEO: NextSeoProps = {
  // title + description are included through next-translate
  titleTemplate: '%s | Revoke.cash',
  openGraph: {
    url: 'https://revoke.cash/',
    images: [
      {
        url: 'https://revoke.cash/assets/images/revoke-og-image.jpg',
        width: 1600,
        height: 900,
      },
    ],
    site_name: 'Revoke.cash',
    type: 'website',
  },
  twitter: {
    handle: '@RoscoKalis',
    site: '@RevokeCash',
    cardType: 'summary_large_image',
  },
  additionalLinkTags: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
    { rel: 'apple-touch-icon', href: '/assets/images/apple-touch-icon.png' },
    { rel: 'manifest', href: '/manifest.json' },
  ],
  additionalMetaTags: [{ name: 'theme-color' as const, content: '#000000' }],
};
