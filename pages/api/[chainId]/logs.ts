import { ironSession } from 'iron-session/express';
import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import requestIp from 'request-ip';
import { IRON_OPTIONS } from 'components/common/constants';
import { CovalentEventGetter } from 'utils/logs/CovalentEventGetter';
import {
  isCovalentSupportedNetwork,
  isEtherscanSupportedNetwork,
  isNodeSupportedNetwork,
} from 'components/common/util';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { NodeEventGetter } from 'utils/logs/NodeEventGetter';
import { EtherscanEventGetter } from 'utils/logs/EtherscanEventGetter';

const rateLimiter = rateLimit({
  windowMs: 1 * 1000, // 1s
  max: 10, // 10 requests
});

axiosRetry(axios, { retries: 3 });

const covalentEventGetter = new CovalentEventGetter(JSON.parse(process.env.COVALENT_API_KEYS));
const etherscanEventGetter = new EtherscanEventGetter(JSON.parse(process.env.ETHERSCAN_API_KEYS));
const nodeEventGetter = new NodeEventGetter(JSON.parse(process.env.NODE_URLS));

const handler = nc<NextApiRequest, NextApiResponse>()
  .use(requestIp.mw({ attributeName: 'ip' }))
  .use(rateLimiter)
  .use(ironSession(IRON_OPTIONS))
  .post(async (req, res) => {
    // TODO: This can become a middleware
    if (!(req.session as any).ip || (req.session as any).ip !== (req as any).ip) {
      return res.status(403).send({});
    }

    const chainId = Number.parseInt(req.query.chainId as string, 10);

    if (isCovalentSupportedNetwork(chainId)) {
      const events = await covalentEventGetter.getEvents(chainId, req.body);
      return res.send(events);
    }

    if (isEtherscanSupportedNetwork(chainId)) {
      const events = await etherscanEventGetter.getEvents(chainId, req.body);
      return res.send(events);
    }

    if (isNodeSupportedNetwork(chainId)) {
      const events = await nodeEventGetter.getEvents(chainId, req.body);
      return res.send(events);
    }

    return res.status(404);
  });

export default handler;
