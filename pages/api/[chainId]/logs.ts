import axios from 'axios';
import { Filter } from '@ethersproject/abstract-provider'
import { ironSession } from "iron-session/express";
import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getAddress } from 'ethers/lib/utils';
import requestIp from 'request-ip';
import PQueue from 'p-queue';
import { IRON_OPTIONS } from 'components/common/constants';
import { splitBlockRangeInChunks } from 'components/common/util';

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

    const events = await getAllEventsFromCovalent(req.query.chainId as string, req.body)

    res.send(events);
  })

// TODO: Currently works with up to 2 topics (and doesn't take topic position into account)
const getAllEventsFromCovalent = async (chainId: string, filter: Filter) => {
  const blockRangeChunks = splitBlockRangeInChunks([[filter.fromBlock as number, filter.toBlock as number]], 1e6);

  const results = await queue.addAll(
    blockRangeChunks.map(([from, to]) => (
      () => getEventsFromCovalent(chainId, from, to, filter.topics as string[])
    ))
  )

  return results.flat()
}

const getEventsFromCovalent = async (chainId: string, fromBlock: number, toBlock: number, topics: string[]) => {
  const [mainTopic, ...secondaryTopics] = topics.filter((topic) => !!topic);
  const url = `https://api.covalenthq.com/v1/${chainId}/events/topics/${mainTopic}/?key=${process.env.COVALENT_API_KEY}&starting-block=${fromBlock}&ending-block=${toBlock}&secondary-topics=${secondaryTopics}&page-size=9999999`;
  const result = await axios.get(url)
  return result?.data?.data?.items?.map(formatEvent) ?? []
}

const formatEvent = (covalentLog: any) => ({
  address: getAddress(covalentLog.sender_address),
  topics: covalentLog.raw_log_topics,
  transactionHash: covalentLog.tx_hash
})

export default handler;
