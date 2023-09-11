import axios from 'axios';
import axiosRetry from 'axios-retry';
import { checkActiveSession, checkRateLimitAllowed, wrapIronSessionApiRoute } from 'lib/api/auth';
import { covalentEventGetter, etherscanEventGetter, nodeEventGetter } from 'lib/api/globals';
import { isCovalentSupportedChain, isEtherscanSupportedChain, isNodeSupportedChain } from 'lib/utils/chains';
import { parseErrorMessage } from 'lib/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

axiosRetry(axios, { retries: 3 });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!checkActiveSession(req)) return res.status(403).send({ message: 'No API session is active' });
  if (!(await checkRateLimitAllowed(req)))
    return res.status(429).send({ message: 'Too many requests, please try again later.' });

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
    return res.status(500).send({ message: parseErrorMessage(e) });
  }

  return res.status(404).send({
    message: `Chain with ID ${chainId} is unsupported`,
  });
};

export default wrapIronSessionApiRoute(handler);
