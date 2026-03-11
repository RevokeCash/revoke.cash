const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });
const withNextIntl = require('next-intl/plugin')('./lib/i18n/request.tsx');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  // Turbopack-compatible way to keep native HyperSync bindings external.
  serverExternalPackages: ['@envio-dev/hypersync-client'],
  images: {
    qualities: [25, 50, 75, 100],
  },
  redirects: async () => {
    return [
      {
        source: '/:locale(en|es|ja|ru|zh)/faq',
        destination: '/:locale/learn/faq',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/learn/faq',
        permanent: true,
      },
      {
        source: '/:locale(en|es|ja|ru|zh)/learn/wallets/add-network',
        destination: '/:locale/learn/wallets/add-network/ethereum',
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
};

module.exports = nextConfig;
module.exports = withNextIntl(module.exports);
module.exports = withBundleAnalyzer(module.exports);
