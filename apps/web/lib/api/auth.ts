import { hasActivePremiumEntitlement, hasActiveUltimateEntitlement } from '@revoke.cash/core/premium/entitlements';
import type { Nullable } from '@revoke.cash/core/types';
import { isNullish } from '@revoke.cash/core/utils';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { DAY, HOUR, SECOND } from '@revoke.cash/core/utils/time';
import { getIronSession, type SessionOptions, unsealData } from 'iron-session';
import { type AuthSession, UNAUTHENTICATED_AUTH_SESSION } from 'lib/auth/session';
import { cookies, headers } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { type Address, getAddress, type Hex, isAddressEqual } from 'viem';

export interface SiweSessionData {
  address: Address;
  verifiedAt: number;
}

// The SIWE wallet cookie stores every wallet that signed in from this browser, so previously
// authenticated wallets can restore a session without a new signature
interface SiweWalletCookieData extends LegacySiweCookieData {
  wallets?: Record<Address, SiweWalletEntry>;
}

interface SiweWalletEntry {
  verifiedAt: number;
}

export interface RevokeSession {
  ip?: string;
  siwe?: SiweSessionData;
  // Set while the admin views the site as another user; read routes then resolve to this address
  impersonatedAddress?: Address;
}

export const IRON_OPTIONS: SessionOptions = {
  cookieName: 'revoke_session',
  password: process.env.IRON_SESSION_PASSWORD!,
  ttl: 60 * 60 * 24,
  cookieOptions: {
    secure: true, // Change this to false when locally testing on Safari / Android Chrome
    sameSite: 'none', // Change this to 'lax' when locally testing on Safari / Android Chrome
  },
};

const SIWE_WALLET_MAX_AGE_MS = 90 * DAY;
export const SIWE_IRON_OPTIONS: SessionOptions = {
  cookieName: 'revoke_siwe',
  password: process.env.IRON_SESSION_PASSWORD!,
  ttl: SIWE_WALLET_MAX_AGE_MS / SECOND, // Backstop: the seal expires 90 days after the last sign-in with any wallet
  cookieOptions: {
    secure: true,
    sameSite: 'none',
  },
};

export const SIWE_NONCE_IRON_OPTIONS: SessionOptions = {
  cookieName: 'revoke_siwe_nonce',
  password: process.env.IRON_SESSION_PASSWORD!,
  ttl: 60 * 10, // The SIWE sign-in must complete within 10 minutes of the nonce being issued
  cookieOptions: {
    secure: true,
    sameSite: 'none',
  },
};

interface SiweNonceSession {
  nonce?: string;
}

export const RateLimiters = {
  AUTH: new RateLimiterMemory({
    points: 5,
    duration: 1,
  }),
  LOGS: new RateLimiterMemory({
    points: 200,
    duration: 1,
  }),
  PRICE: new RateLimiterMemory({
    points: 50,
    duration: 1,
  }),
  SPENDER: new RateLimiterMemory({
    points: 500,
    duration: 1,
  }),
  PUDGY: new RateLimiterMemory({
    points: 5,
    duration: 1,
  }),
  BATCH_REVOKE: new RateLimiterMemory({
    points: 10,
    duration: 1 * 60,
  }),
  PREMIUM_READ: new RateLimiterMemory({
    points: 200,
    duration: 1,
  }),
  PREMIUM_WRITE: new RateLimiterMemory({
    points: 2,
    duration: 1,
  }),
};

export const checkRateLimitAllowed = async (req: NextRequest, rateLimiter: RateLimiterMemory) => {
  const ip = getClientIpFromHeaders(req.headers);

  try {
    await rateLimiter.consume(ip);
    return true;
  } catch {
    return false;
  }
};

export const storeSession = async (req: NextRequest, res: NextResponse, sessionUpdate?: Partial<RevokeSession>) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);

  // Store the user's IP as an identifier
  session.ip = getClientIpFromHeaders(req.headers);

  // Update the session with the provided sessionUpdate if provided
  session.siwe = sessionUpdate?.siwe;

  // Any sign-in, session restore or anonymous login replaces the session identity, which ends impersonation
  delete session.impersonatedAddress;

  await session.save();
};

// Starts (address) or stops (null) viewing the site as another user; callers must verify the admin session first
export const storeImpersonation = async (req: NextRequest, res: NextResponse, address: Address | null) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);

  if (address) {
    session.impersonatedAddress = getAddress(address);
  } else {
    delete session.impersonatedAddress;
  }

  await session.save();
};

export const unsealSession = async (sealedSession: string) => {
  const { password, ttl } = IRON_OPTIONS;
  return unsealData<RevokeSession>(sealedSession, { password, ttl });
};

export const storeSiweWallet = async (req: NextRequest, res: NextResponse, siwe: SiweSessionData) => {
  const session = await getIronSession<SiweWalletCookieData>(req, res, SIWE_IRON_OPTIONS);

  const wallets = getValidSiweWallets(session);
  wallets[getAddress(siwe.address)] = { verifiedAt: siwe.verifiedAt };
  session.wallets = wallets;

  deleteLegacyCookieData(session);

  await session.save();
};

export const getStoredSiweWallet = async (req: NextRequest, address: Address): Promise<SiweSessionData | null> => {
  const siweCookie = req.cookies.get(SIWE_IRON_OPTIONS.cookieName)?.value;
  if (!siweCookie) return null;

  try {
    const { password, ttl } = SIWE_IRON_OPTIONS;
    const cookieData = await unsealData<SiweWalletCookieData>(siweCookie, { password, ttl });
    const wallet = getValidSiweWallets(cookieData)[getAddress(address)];
    if (!wallet) return null;

    return { address: getAddress(address), verifiedAt: wallet.verifiedAt };
  } catch {
    return null;
  }
};

const getValidSiweWallets = (cookieData: SiweWalletCookieData): Record<Address, SiweWalletEntry> => {
  const wallets = cookieData.wallets ?? getLegacySiweWallet(cookieData);
  const validWallets = Object.entries(wallets).filter(([, wallet]) => isSiweWalletValid(wallet));
  return Object.fromEntries(validWallets) as Record<Address, SiweWalletEntry>;
};

const isSiweWalletValid = (wallet: SiweWalletEntry): boolean => {
  return Date.now() - wallet.verifiedAt <= SIWE_WALLET_MAX_AGE_MS;
};

export const storeSiweNonceCookie = async (req: NextRequest, res: NextResponse, nonce: string) => {
  const session = await getIronSession<SiweNonceSession>(req, res, SIWE_NONCE_IRON_OPTIONS);
  session.nonce = nonce;
  await session.save();
};

export const getSiweNonceCookie = async (req: NextRequest): Promise<string | null> => {
  const nonceCookie = req.cookies.get(SIWE_NONCE_IRON_OPTIONS.cookieName)?.value;
  if (!nonceCookie) return null;

  try {
    const { password, ttl } = SIWE_NONCE_IRON_OPTIONS;
    const session = await unsealData<SiweNonceSession>(nonceCookie, { password, ttl });
    return session.nonce ?? null;
  } catch {
    return null;
  }
};

export const destroySiweNonceCookie = async (req: NextRequest, res: NextResponse) => {
  const session = await getIronSession<SiweNonceSession>(req, res, SIWE_NONCE_IRON_OPTIONS);
  session.destroy();
};

export const destroySession = async (req: NextRequest, res: NextResponse) => {
  const mainSession = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);
  mainSession.destroy();
};

export const checkActiveSession = async (req: NextRequest) => {
  const sealedSession = req.cookies.get(IRON_OPTIONS.cookieName)?.value;
  const authSession = await getAuthSessionByHeaders(req.headers, sealedSession);
  return authSession.hasApiSession;
};

export const getAuthSessionByHeaders = async (headers: Headers, sealedSession?: string): Promise<AuthSession> => {
  if (!sealedSession) return UNAUTHENTICATED_AUTH_SESSION;

  try {
    const session = await unsealSession(sealedSession);
    if (!session.ip) return UNAUTHENTICATED_AUTH_SESSION;

    const requestIp = getClientIpFromHeaders(headers);
    if (!requestIp || requestIp !== session.ip) return UNAUTHENTICATED_AUTH_SESSION;

    const impersonatedAddress = getImpersonatedAddress(session);

    return {
      hasApiSession: true,
      siweAddress: impersonatedAddress ?? session.siwe?.address ?? null,
      isImpersonating: Boolean(impersonatedAddress),
    };
  } catch {
    return UNAUTHENTICATED_AUTH_SESSION;
  }
};

export const getServerAuthSession = async () => {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const sessionCookie = cookieStore.get(IRON_OPTIONS.cookieName)?.value;

  return getAuthSessionByHeaders(requestHeaders, sessionCookie);
};

type ApiAuthMode = 'api-session' | 'siwe';

const MUTATING_HTTP_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

interface AuthorizeRequestOptions {
  auth?: ApiAuthMode;
  rateLimiter?: RateLimiterMemory;
  requireUltimateEntitlement?: boolean;
  requireAdmin?: boolean;
}

export async function authorizeRequest(
  req: NextRequest,
  options: AuthorizeRequestOptions & { auth: 'siwe' },
): Promise<{ siweAddress: Address }>;
export async function authorizeRequest(
  req: NextRequest,
  options?: AuthorizeRequestOptions,
): Promise<{ siweAddress: Address | null }>;
export async function authorizeRequest(
  req: NextRequest,
  options: AuthorizeRequestOptions = {},
): Promise<{ siweAddress: Address | null }> {
  // Session cookies are sameSite 'none', so SIWE-authenticated state-changing requests must be same-origin (CSRF)
  if (options.auth === 'siwe' && MUTATING_HTTP_METHODS.includes(req.method)) {
    requireSameOrigin(req);
  }

  // Admin routes always act as the admin, so impersonation never applies to them
  const siweAddress = options.requireAdmin
    ? await requireAdminSession(req)
    : await getAuthorizedSiweAddress(req, options.auth);

  if (options.rateLimiter) {
    await requireRateLimit(req, options.rateLimiter);
  }

  if (options.requireUltimateEntitlement) {
    if (!siweAddress) {
      throw new ApiError(403, 'No SIWE session is active');
    }

    await requireUltimateEntitlement(siweAddress);
  }

  return { siweAddress };
}

// Admin access requires a signature fresher than the main session TTL, so the silent restore
// from the 90-day SIWE cookie never mints admin access without a new signature.
const MAX_ADMIN_SESSION_AGE_MS = 24 * HOUR;

export const requireAdminSession = async (req: NextRequest): Promise<Address> => {
  const siwe = await getAuthenticatedSiweSession(req);
  if (!siwe || !isAdminAddress(siwe.address)) {
    throw new ApiError(403, 'Not authorized');
  }

  if (!siwe.verifiedAt || Date.now() - siwe.verifiedAt > MAX_ADMIN_SESSION_AGE_MS) {
    throw new ApiError(403, 'Admin session expired, please sign in again');
  }

  return siwe.address;
};

export const isAdminSession = async (req: NextRequest): Promise<boolean> => {
  try {
    await requireAdminSession(req);
    return true;
  } catch {
    return false;
  }
};

const isAdminAddress = (address: Address): boolean => {
  const adminAddress = process.env.ADMIN_ADDRESS;
  if (!adminAddress) return false;

  try {
    return isAddressEqual(address, getAddress(adminAddress));
  } catch {
    return false;
  }
};

const isFreshAdminSiweSession = (siwe: SiweSessionData | undefined): boolean => {
  if (!siwe || !isAdminAddress(siwe.address)) return false;
  return Boolean(siwe.verifiedAt) && Date.now() - siwe.verifiedAt <= MAX_ADMIN_SESSION_AGE_MS;
};

// The impersonated address only counts while the underlying session is still a fresh admin session
const getImpersonatedAddress = (session: RevokeSession): Address | null => {
  if (!session.impersonatedAddress || !isFreshAdminSiweSession(session.siwe)) return null;
  return session.impersonatedAddress;
};

const getAuthenticatedSession = async (req: NextRequest): Promise<RevokeSession | null> => {
  const sealedSession = req.cookies.get(IRON_OPTIONS.cookieName)?.value;
  if (!sealedSession) return null;

  try {
    const session = await unsealSession(sealedSession);
    if (!session.ip || session.ip !== getClientIpFromHeaders(req.headers)) return null;
    return session;
  } catch {
    return null;
  }
};

const getAuthenticatedSiweSession = async (req: NextRequest): Promise<SiweSessionData | null> => {
  const session = await getAuthenticatedSession(req);
  return session?.siwe ?? null;
};

// Session cookies are sameSite 'none', so state-changing endpoints must reject cross-origin requests
export const requireSameOrigin = (req: NextRequest) => {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  try {
    if (!origin || !host || new URL(origin).host !== host) {
      throw new Error('Origin mismatch');
    }
  } catch {
    throw new ApiError(403, 'Cross-origin request rejected');
  }
};

export const requireApiSession = async (req: NextRequest) => {
  if (!(await checkActiveSession(req))) {
    throw new ApiError(403, 'No API session is active');
  }
};

export const requireSiweSession = async (req: NextRequest): Promise<Address> => {
  const session = await getAuthenticatedSession(req);
  if (!session?.siwe) {
    throw new ApiError(403, 'No SIWE session is active');
  }

  // While impersonating, reads resolve to the impersonated user and writes are rejected outright, so the
  // admin sees the account exactly as the user does without being able to change anything on their behalf
  const impersonatedAddress = getImpersonatedAddress(session);
  if (impersonatedAddress) {
    if (MUTATING_HTTP_METHODS.includes(req.method)) {
      throw new ApiError(403, 'Write actions are disabled while impersonating a user');
    }

    return impersonatedAddress;
  }

  return session.siwe.address;
};

export const requireRateLimit = async (
  req: NextRequest,
  rateLimiter: RateLimiterMemory,
  message = 'Too many requests, please try again later.',
) => {
  if (!(await checkRateLimitAllowed(req, rateLimiter))) {
    throw new ApiError(429, message);
  }
};

export const requirePremiumEntitlement = async (address: Address, message = 'Premium subscription required') => {
  if (!(await hasActivePremiumEntitlement(address))) {
    throw new ApiError(403, message);
  }
};

export const requireUltimateEntitlement = async (address: Address) => {
  if (!(await hasActiveUltimateEntitlement(address))) {
    throw new ApiError(403, 'Ultimate subscription required');
  }
};

export const requireCronSecret = (req: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw new ApiError(401, 'Unauthorized');
  }
};

const getAuthorizedSiweAddress = async (req: NextRequest, auth: ApiAuthMode | undefined): Promise<Address | null> => {
  if (auth === 'api-session') {
    await requireApiSession(req);
    return null;
  }

  if (auth === 'siwe') {
    return requireSiweSession(req);
  }

  return null;
};

// Note: if ever moving to a different hosting / reverse proxy, then we need to update this
const getClientIpFromHeaders = (headers: Headers): string => {
  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (isIp(cfConnectingIp)) return cfConnectingIp;

  // Vercel
  const realIp = headers.get('x-real-ip');
  if (isIp(realIp)) return realIp;

  // Other
  const xForwardedFor = headers.get('x-forwarded-for')?.split(',')?.at(0);
  if (isIp(xForwardedFor)) return xForwardedFor;

  throw new Error('Request headers malformed');
};

export const getClientCountry = (req: NextRequest): string | null => {
  // Cloudflare
  const cfCountry = req.headers.get('cf-ipcountry');
  if (cfCountry) return cfCountry;

  // Vercel
  const vercelCountry = req.headers.get('x-vercel-ip-country');
  if (vercelCountry) return vercelCountry;

  return null;
};

// From request-ip
const regexes = {
  ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
  ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
};

const isIp = (ip?: Nullable<string>): ip is string => {
  return !isNullish(ip) && (regexes.ipv4.test(ip) || regexes.ipv6.test(ip));
};

// LEGACY //////////////////////////////////////////////////////////////////////
// Note: all legacy stuff should be removed on Nov 1st.
interface LegacySiweCookieData {
  address?: Address;
  message?: string;
  signature?: Hex;
  verifiedAt?: number;
}

const getLegacySiweWallet = (cookieData: LegacySiweCookieData): Record<Address, SiweWalletEntry> => {
  if (!cookieData.address || !cookieData.verifiedAt) return {};
  return { [getAddress(cookieData.address)]: { verifiedAt: cookieData.verifiedAt } };
};

const deleteLegacyCookieData = (session: LegacySiweCookieData) => {
  delete session.address;
  delete session.message;
  delete session.signature;
  delete session.verifiedAt;
};
