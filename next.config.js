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
      {
        source: '/learn',
        destination: '/learn/basics/what-is-a-crypto-wallet',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/learn/faq',
        permanent: true,
      },
      {
        source: '/learn/wallets/add-network',
        destination: '/learn/wallets/add-network/ethereum',
        permanent: true,
      },
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
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

module.exports = withBundleAnalyzer(nextTranslate(nextConfig));
