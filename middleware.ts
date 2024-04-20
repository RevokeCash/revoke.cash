import { defaultLocale, localePrefix, locales } from 'lib/i18n/config';
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({ locales, localePrefix, defaultLocale });

export const config = {
  // Do not match non-page URLs (/_next, /_vercel, /monitoring, /api + URLs with a . in them)
  matcher: ['/((?!api|_next|_vercel|monitoring|.*\\..*).*)'],
};
