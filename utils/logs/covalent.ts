import { splitBlockRangeInChunks } from 'components/common/util';
import { Filter } from '@ethersproject/abstract-provider'
import PQueue from 'p-queue';
import axios from 'axios';
import { getAddress } from 'ethers/lib/utils';

// TODO: Currently works with up to 2 topics (and doesn't take topic position into account)
export const getAllEventsFromCovalent = async (chainId: number, filter: Filter, queue: PQueue) => {
  const blockRangeChunks = splitBlockRangeInChunks([[filter.fromBlock as number, filter.toBlock as number]], 1e6);

  const results = await queue.addAll(
    blockRangeChunks.map(([from, to]) => (
      () => getEventsFromCovalent(chainId, from, to, filter.topics as string[])
    ))
  )

  return results.flat()
}

const getEventsFromCovalent = async (chainId: number, fromBlock: number, toBlock: number, topics: string[]) => {
  const [mainTopic, ...secondaryTopics] = topics.filter((topic) => !!topic);
  const url = `https://api.covalenthq.com/v1/${chainId}/events/topics/${mainTopic}/?key=${process.env.COVALENT_API_KEY}&starting-block=${fromBlock}&ending-block=${toBlock}&secondary-topics=${secondaryTopics}&page-size=9999999`;
  const result = await axios.get(url)
  return result?.data?.data?.items?.map(formatCovalentEvent) ?? []
}

const formatCovalentEvent = (covalentLog: any) => ({
  address: getAddress(covalentLog.sender_address),
  topics: covalentLog.raw_log_topics,
  transactionHash: covalentLog.tx_hash
})
