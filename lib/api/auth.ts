import { IronSessionOptions } from 'iron-session';
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiHandler, NextApiRequest } from 'next';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import requestIp from 'request-ip';

declare module 'iron-session' {
  interface IronSessionData {
    ip?: string;
  }
}

export const IRON_OPTIONS: IronSessionOptions = {
  cookieName: 'revoke_session',
  password: process.env.IRON_SESSION_PASSWORD,
  ttl: 60 * 60 * 24,
  cookieOptions: {
    secure: true, // Change this to false when locally testing on Safari
    sameSite: 'none',
  },
};

export const wrapIronSessionApiRoute = (handler: NextApiHandler) => {
  return withIronSessionApiRoute(handler, IRON_OPTIONS);
};

// Rate limiting max 20 requests per second
const rateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 1,
});

export const checkRateLimitAllowed = async (req: NextApiRequest) => {
  try {
    await rateLimiter.consume(requestIp.getClientIp(req));
    return true;
  } catch (e) {
    return false;
  }
};

export const checkActiveSession = (req: NextApiRequest) => {
  return req.session.ip && req.session.ip === requestIp.getClientIp(req);
};
