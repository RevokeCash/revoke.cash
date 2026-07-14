const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });
const withNextIntl = require('next-intl/plugin')('./lib/i18n/request.tsx');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR,
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  // Turbopack-compatible way to keep native HyperSync bindings external.
  // pdfkit reads its built-in font data from disk at runtime, so it must stay unbundled too.
  serverExternalPackages: ['@envio-dev/hypersync-client', 'pdfkit'],
  outputFileTracingIncludes: {
    // The invoice header embeds the logo via an fs read from public/
    '/api/admin/revenue/invoice': ['./public/assets/images/revoke-icon-orange-black.png'],
  },
  turbopack: {
    resolveAlias: {
      siwe: './app/embed/world/stubs/siwe.js',
    },
  },
  images: {
    qualities: [25, 50, 75, 100],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  headers: async () => {
    // Add extra security headers to the admin pages and API endpoints
    const adminSecurityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'none'; object-src 'none'; base-uri 'none'",
      },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ];

    return [
      { source: '/admin/:path*', headers: adminSecurityHeaders },
      { source: '/api/admin/:path*', headers: adminSecurityHeaders },
    ];
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
