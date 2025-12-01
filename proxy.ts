import { routing } from 'lib/i18n/config';
import createMiddleware from 'next-intl/middleware';

export default createMiddleware(routing);

export const config = {
  // Allow all paths starting with /address and apply exclusions to other paths
  matcher: [
    // Match any path starting with /address
    '/address/(.*)',
    // Do not match non-page URLs (/_next, /_vercel, /monitoring, /api + URLs with a . in them)
    '/((?!_next|_vercel|monitoring|api|.*\\..*$).*)',
  ],
};
