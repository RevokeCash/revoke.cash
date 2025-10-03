const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });
const withNextIntl = require('next-intl/plugin')('./lib/i18n/config.tsx');
const withNextCircularDeps = require('next-circular-dependency');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  exclude: /a\.js|node_modules/, // exclude node_modules for checking circular dependencies
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
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, path: false };
    config.externals.push('pino-pretty');

    // We're running into issues with webpack when importing the hypersync client directly
    if (isServer) {
      config.externals.push(({ request }, callback) => {
        if (request?.startsWith('@envio-dev/hypersync-client-') || request?.endsWith('.node')) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
    }

    return config;
  },
};

module.exports = nextConfig;
module.exports = withNextIntl(module.exports);
module.exports = withBundleAnalyzer(module.exports);

if (process.env.CHECK_CIRCULAR_DEPS) {
  module.exports = withNextCircularDeps(module.exports);
}
