const withPreact = require('next-plugin-preact');
const withBundleAnalyzer = require('next-bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    return [
      {
        source: '/privacy-policy',
        destination: '/privacy-policy.html',
      },
    ];
  },
};

module.exports = withBundleAnalyzer(withPreact(nextConfig));
