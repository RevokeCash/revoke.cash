import { type SessionOptions, getIronSession, unsealData } from 'iron-session';
import type { Nullable } from 'lib/interfaces';
import { isNullish } from 'lib/utils';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextRequest } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export interface RevokeSession {
  ip?: string;
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
  } catch (e) {
    return false;
  }
};

export const storeSession = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);
  // Store the user's IP as an identifier
  session.ip = getClientIp(req);
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
  const cookie = req.cookies.get(IRON_OPTIONS.cookieName);
  if (!cookie) return false;

  const session = await unsealSession(cookie.value);

  return session.ip && getClientIpEdge(req) === session.ip;
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
  // Cloudflare
  if (isIp(req.headers.get('cf-connecting-ip'))) return req.headers.get('cf-connecting-ip')!;

  // Vercel
  if (isIp(req.headers.get('x-real-ip'))) return req.headers.get('x-real-ip')!;

  // Other
  const xForwardedFor = req.headers.get('x-forwarded-for')?.split(',')?.at(0);
  if (isIp(xForwardedFor)) return xForwardedFor;

  throw new Error('Request headers malformed');
};

// From request-ip
const regexes = {
  ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
  ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
};

const isIp = (ip?: Nullable<string>): ip is string => {
  return !isNullish(ip) && (regexes.ipv4.test(ip) || regexes.ipv6.test(ip));
};
