import { SessionOptions, getIronSession } from 'iron-session';
import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import requestIp from 'request-ip';

export interface RevokeSession {
  ip?: string;
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
    await rateLimiter.consume(requestIp.getClientIp(req));
    return true;
  } catch (e) {
    return false;
  }
};

export const storeSession = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);
  // Store the user's IP as an identifier
  session.ip = requestIp.getClientIp(req);
  await session.save();
};

export const checkActiveSession = async (req: NextApiRequest, res: NextApiResponse) => {
  // return session.ip && session.ip === requestIp.getClientIp(req);
  // TODO
  const session = await getIronSession<RevokeSession>(req, res, IRON_OPTIONS);
  console.log('>>>>>>', session.ip, requestIp.getClientIp(req));
  return true;
};
