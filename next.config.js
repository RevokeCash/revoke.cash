const withBundleAnalyzer = require('next-bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });
const nextTranslate = require('next-translate-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  rewrites: async () => {
    return [
      {
        source: '/privacy-policy',
        destination: '/privacy-policy.html',
      },
    ];
  },
  redirects: async () => {
    return [
      // Some images are somehow being requested (probably by other websites). We redirect them to a placeholder image.
      {
        source: '/erc20.png',
        destination: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg',
        permanent: true,
      },
      {
        source: '/assets/images/fallback-token-image.png',
        destination: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg',
        permanent: true,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextTranslate(nextConfig));
