import rateLimit from 'express-rate-limit';
import { ironSession } from 'iron-session/express';
import { IRON_OPTIONS } from 'lib/constants';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import requestIp from 'request-ip';

const rateLimiter = rateLimit({
  windowMs: 1 * 1000, // 1s
  max: 10, // 10 requests
});

const handler = nc<NextApiRequest, NextApiResponse>()
  .use(requestIp.mw({ attributeName: 'ip' }))
  .use(rateLimiter)
  .use(ironSession(IRON_OPTIONS))
  .post(async (req, res) => {
    // Store the user's IP as an identifier
    (req.session as any).ip = (req as any).ip;
    await req.session.save();
    res.send({ ok: true });
  });

export default handler;
