import { getIronSession, type SessionOptions, unsealData } from 'iron-session';
import { type AuthSession, UNAUTHENTICATED_AUTH_SESSION } from 'lib/auth/session';
import type { Nullable } from 'lib/interfaces';
import { isNullish } from 'lib/utils';
import type { NextApiRequest, NextApiResponse } from 'next';
import { cookies, headers } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { Address, Hex } from 'viem';

export interface SiweFields {
  address: Address;
  message: string;
  signature: Hex;
}

export interface RevokeSession {
  ip?: string;
  siwe?: SiweFields;
}

export const IRON_OPTIONS: SessionOptions = {
  cookieName: 'revoke_session',
  password: process.env.IRON_SESSION_PASSWORD!,
  ttl: 60 * 60 * 24,
  cookieOptions: {
    secure: true, // Change this to false when locally testing on Safari
    sameSite: 'none',
  },
};

export const RateLimiters = {
  LOGS: new RateLimiterMemory({
    points: 20,
    duration: 1,
  }),
  PRICE: new RateLimiterMemory({
    points: 100,
    duration: 1,
  }),
  SPENDER: new RateLimiterMemory({
    points: 100,
    duration: 1,
  }),
  MERCH_CODES: new RateLimiterMemory({
    points: 2,
    duration: 1,
  }),
  PUDGY: new RateLimiterMemory({
    points: 5,
    duration: 1,
  }),
  BATCH_REVOKE: new RateLimiterMemory({
    points: 10,
    duration: 1,
  }),
};

export const checkRateLimitAllowed = async (req: NextApiRequest, rateLimiter: RateLimiterMemory) => {
  return checkRateLimitAllowedByIp(getClientIp(req), rateLimiter);
};

export const checkRateLimitAllowedEdge = async (req: NextRequest, rateLimiter: RateLimiterMemory) => {
  return checkRateLimitAllowedByIp(getClientIpEdge(req), rateLimiter);
};

export const checkRateLimitAllowedByIp = async (ip: string, rateLimiter: RateLimiterMemory) => {
  try {
    await rateLimiter.consume(ip);
    return true;
  } catch {
    return false;
  }
};

export const storeSession = async (
  req: NextApiRequest,
  res: NextApiResponse,
  sessionUpdate?: Partial<RevokeSession>,
) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);

  // Store the user's IP as an identifier
  session.ip = getClientIp(req);

  // Update the session with the provided sessionUpdate if provided
  session.siwe = sessionUpdate?.siwe;

  await session.save();
};

export const storeSessionEdge = async (req: NextRequest, res: NextResponse, sessionUpdate?: Partial<RevokeSession>) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);

  // Store the user's IP as an identifier
  session.ip = getClientIpEdge(req);

  // Update the session with the provided sessionUpdate if provided
  session.siwe = sessionUpdate?.siwe;

  await session.save();
};

export const unsealSession = async (sealedSession: string) => {
  const { password, ttl } = IRON_OPTIONS;
  return unsealData<RevokeSession>(sealedSession, { password, ttl });
};

export const checkActiveSession = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);
  return session.ip && session.ip === getClientIp(req);
};

export const checkActiveSessionEdge = async (req: NextRequest) => {
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

    return {
      hasApiSession: true,
      siweAddress: session.siwe?.address ?? null,
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

// Note: if ever moving to a different hosting / reverse proxy, then we need to update this
const getClientIp = (req: NextApiRequest): string => {
  // Cloudflare
  if (isIp(req.headers['cf-connecting-ip'] as string)) return req.headers['cf-connecting-ip'] as string;

  // Vercel
  if (isIp(req.headers['x-real-ip'] as string)) return req.headers['x-real-ip'] as string;

  // Other
  const xForwardedFor = (req.headers['x-forwarded-for'] as string)?.split(',')?.at(0);
  if (isIp(xForwardedFor)) return xForwardedFor;

  throw new Error('Request headers malformed');
};

const getClientIpEdge = (req: NextRequest): string => {
  return getClientIpFromHeaders(req.headers);
};

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

export const getClientCountryEdge = (req: NextRequest): string | null => {
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
