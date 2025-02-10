import { trackPageview } from '@simpleanalytics/next/server';
import { defaultLocale, localePrefix, locales } from 'lib/i18n/config';
import createMiddleware from 'next-intl/middleware';
import type { NextFetchEvent, NextRequest } from 'next/server';

const handleI18n = createMiddleware({ locales, localePrefix, defaultLocale });
const handleAnalytics = (request: NextRequest, event: NextFetchEvent) => {
  event.waitUntil(trackPageview({ request }));
};

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  console.log('request', request);
  handleAnalytics(request, event);
  return handleI18n(request);
}

export const config = {
  // Allow all paths starting with /address and apply exclusions to other paths
  matcher: [
    // Match any path starting with /address
    '/address/(.*)',
    // Do not match non-page URLs (/_next, /_vercel, /monitoring, /api + URLs with a . in them)
    '/((?!_next|_vercel|monitoring|api|.*\\..*$).*)',
  ],
};
