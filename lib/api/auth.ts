import { SessionOptions, getIronSession } from 'iron-session';
import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { SiweMessage } from 'siwe';

export interface RevokeSession {
  ip?: string;
  siwe?: {};
}

export const IRON_OPTIONS: SessionOptions = {
  cookieName: 'revoke_session',
  password: process.env.IRON_SESSION_PASSWORD,
  ttl: 60 * 60 * 24,
  cookieOptions: {
    secure: true, // Change this to false when locally testing on Safari
    sameSite: 'none',
  },
};

// Rate limiting max 20 requests per second
const rateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 1,
});

export const checkRateLimitAllowed = async (req: NextApiRequest) => {
  try {
    await rateLimiter.consume(getClientIp(req));
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Wraps an API route with a session, ensuring that the session is available to the handler.
 */
export const withSession = (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req, res);

    req.session = session;

    await handler(req, res);
  };
};

declare module 'next' {
  interface NextApiRequest {
    session: RevokeSession;
  }
}

export const storeSession = async (req: NextApiRequest, res: NextApiResponse, siwe?: SiweMessage) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);
  // Store the user's IP as an identifier
  session.ip = getClientIp(req);

  // Store the verified SiweMessage
  if (siwe) session.siwe = siwe;

  await session.save();
};

export const getSession = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);
  return session;
};

export const checkActiveSession = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);
  return session.ip && session.ip === getClientIp(req);
};

// Note: if ever moving to a different hosting / reverse proxy, then we need to update this
const getClientIp = (req: NextApiRequest) => {
  // Cloudflare
  if (isIp(req.headers['cf-connecting-ip'] as string)) return req.headers['cf-connecting-ip'] as string;

  // Vercel
  if (isIp(req.headers['x-real-ip'] as string)) return req.headers['x-real-ip'] as string;

  // Other
  const xForwardedFor = (req.headers['x-forwarded-for'] as string)?.split(',')?.at(0);
  if (isIp(xForwardedFor)) return xForwardedFor;

  throw new Error('Request headers malformed');
};

// From request-ip
const regexes = {
  ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
  ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
};

const isIp = (ip: string) => {
  return !!ip && (regexes.ipv4.test(ip) || regexes.ipv6.test(ip));
};
