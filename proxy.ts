import { routing } from 'lib/i18n/routing';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Forward the URL so server components can read it via headers()
  request.headers.set('x-url-path', request.nextUrl.pathname + request.nextUrl.search);
  return intlMiddleware(request);
}

export const config = {
  // Allow all paths starting with /address and apply exclusions to other paths
  matcher: [
    // Match any path starting with /address
    '/address/(.*)',
    '/premium/address/(.*)',
    // Do not match non-page URLs (/_next, /_vercel, /monitoring, /api, /embed + URLs with a . in them)
    '/((?!_next|_vercel|monitoring|api|embed|.*\\..*$).*)',
  ],
};
