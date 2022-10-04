import axios from 'axios';
import axiosRetry from 'axios-retry';
import { ironSession } from 'iron-session/express';
import { covalentEventGetter, etherscanEventGetter, nodeEventGetter, rateLimiter } from 'lib/api/globals';
import { IRON_OPTIONS } from 'lib/constants';
import { isCovalentSupportedChain, isEtherscanSupportedChain, isNodeSupportedChain } from 'lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import requestIp from 'request-ip';

axiosRetry(axios, { retries: 3 });

const handler = nc<NextApiRequest, NextApiResponse>()
  .use(requestIp.mw({ attributeName: 'ip' }))
  .use(rateLimiter)
  .use(ironSession(IRON_OPTIONS))
  .post(async (req, res) => {
    console.log(req.session, (req as any).ip);
    // TODO: This can become a middleware
    if (!(req.session as any).ip || (req.session as any).ip !== (req as any).ip) {
      return res.status(403).send({ message: 'No API session is active' });
    }

    console.log('Request body', req.body);

    const chainId = Number.parseInt(req.query.chainId as string, 10);

    try {
      if (isCovalentSupportedChain(chainId)) {
        const events = await covalentEventGetter.getEvents(chainId, req.body);
        return res.send(events);
      }

      if (isEtherscanSupportedChain(chainId)) {
        const events = await etherscanEventGetter.getEvents(chainId, req.body);
        return res.send(events);
      }

      if (isNodeSupportedChain(chainId)) {
        const events = await nodeEventGetter.getEvents(chainId, req.body);
        return res.send(events);
      }
    } catch (e) {
      console.log('Error occurred', e);
      throw e;
    }

    return res.status(404).send({
      message: `Chain with ID ${chainId} is unsupported`,
    });
  });

export default handler;
