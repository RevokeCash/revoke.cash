import { ironSession } from 'iron-session/express';
import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import requestIp from 'request-ip';
import PQueue from 'p-queue';
import { IRON_OPTIONS } from 'components/common/constants';
import { getAllEventsFromCovalent } from 'utils/logs/covalent';
import { isCovalentSupportedNetwork } from 'components/common/util';

const rateLimiter = rateLimit({
  windowMs: 1 * 1000, // 1s
  max: 10, // 10 requests
});

// Set up a shared queue that limits the global number of requests sent to Covalent to 5 (API rate limit)
const queue = new PQueue({ concurrency: 5 });

const handler = nc<NextApiRequest, NextApiResponse>()
  .use(requestIp.mw({ attributeName: 'ip' }))
  .use(rateLimiter)
  .use(ironSession(IRON_OPTIONS))
  .post(async (req, res) => {
    // TODO: This can become a middleware
    if (!(req.session as any).ip || (req.session as any).ip !== (req as any).ip) {
      return res.status(403).send({})
    }

    const chainId = Number.parseInt(req.query.chainId as string, 10)

    if (isCovalentSupportedNetwork(chainId)) {
      const events = await getAllEventsFromCovalent(chainId, req.body, queue)
      res.send(events);
    }

    res.status(404);
  })

export default handler;
