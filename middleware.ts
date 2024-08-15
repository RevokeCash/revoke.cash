import { PageViewData } from 'lib/databases/analytics';
import { defaultLocale, localePrefix, locales } from 'lib/i18n/config';
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

export const middleware = (request: NextRequest) => {
  const isPageView = isValidPageView(request);

  if (isPageView) {
    trackPageView(request);
  }

  return createMiddleware({ locales, localePrefix, defaultLocale })(request);
};

const trackPageView = async (request: NextRequest) => {
  const server = getURL('/api/track');

  const url = new URL(request.url);
  const path = url.pathname;
  const referrer = request.headers.get('referer');
  const agent = request.headers.get('user-agent');

  const data: PageViewData = {
    path,
    ...(referrer && { referrer }),
    ...(referrer && { referrer }),
    ...(agent && { agent }),
    hostname: server.hostname,
  };

  // Send data to /api/track
  fetch(server.href, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'page-view',
      ...data,
    }),
  }).catch(() => {});
};

/**
 * Get the URL of the current (vercel) deployment
 */
const getURL = (path?: `/${string}`) => {
  const hostname =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'localhost:3000';
  const isDev = process.env.NODE_ENV !== 'production';

  const protocol = isDev ? 'http' : 'https';

  return new URL(`${protocol}://${hostname}${path || ''}`);
};

const isValidPageView = (request: NextRequest) => {
  // List of regex patterns to match against the user-agent header
  const botUserAgents = [
    '.*bot.*',
    '.*preview.*',
    '.*crawler.*',
    '.*google.*',
    '.*bing.*',
    '.*yahoo.*',
    '.*baidu.*',
    '.*yandex.*',
    '.*duckduckgo.*',
    '.*facebook.*',
    '.*twitter.*',
    '.*instagram.*',
    '.*pinterest.*',
    '.*linkedin.*',
  ];

  // Check if the user-agent header matches any of the bot patterns
  const isBot = botUserAgents.some((pattern) => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(request.headers.get('user-agent'));
  });
  if (isBot) return false;

  const ref = new URL(request.headers.get('referer'));
  const url = new URL(request.url);

  const isNavigating = request.headers.has('next-url');
  if (isNavigating) return false;

  // Check if the request is a navigation
  const isNavigation = ref.pathname !== url.pathname;

  if (isNavigation) return true;

  // Check if the request is a page view
  const isPageView = request.headers.get('sec-fetch-mode') === 'navigate';

  if (!isPageView) return false;

  return true;
};

export const config = {
  // Allow all paths starting with /address and apply exclusions to other paths
  matcher: [
    // Match any path starting with /address
    '/address/(.*)',
    // Do not match non-page URLs (/_next, /_vercel, /monitoring, /api + URLs with a . in them)
    '/((?!_next|_vercel|monitoring|api|.*\\..*$).*)',
  ],
};
