import { Filter, Log } from '@ethersproject/abstract-provider'
import PQueue from 'p-queue';
import axios from 'axios';
import { getAddress } from 'ethers/lib/utils';
import { EventGetter } from './EventGetter';

export class CovalentEventGetter implements EventGetter {
  // Set up a shared queue that limits the global number of requests sent to Covalent to 5/s (API rate limit)
  private queue = new PQueue({ intervalCap: 5, interval: 1000 });

  // TODO: Currently works with up to 2 topics (and doesn't take topic position into account)
  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const blockRangeChunks = splitBlockRangeInChunks([[filter.fromBlock as number, filter.toBlock as number]], 1e6);

    const results = await this.queue.addAll(
      blockRangeChunks.map(([from, to]) => (
        () => this.getEventsInChunk(chainId, from, to, filter.topics as string[])
      ))
    )

    return results.flat()
  }

  private async getEventsInChunk(chainId: number, fromBlock: number, toBlock: number, topics: string[]) {
    const [mainTopic, ...secondaryTopics] = topics.filter((topic) => !!topic);
    const url = `https://api.covalenthq.com/v1/${chainId}/events/topics/${mainTopic}/?key=${process.env.COVALENT_API_KEY}&starting-block=${fromBlock}&ending-block=${toBlock}&secondary-topics=${secondaryTopics}&page-size=9999999`;
    const result = await axios.get(url)
    return result?.data?.data?.items?.map(formatCovalentEvent) ?? []
  }
}

const formatCovalentEvent = (covalentLog: any) => ({
  address: getAddress(covalentLog.sender_address),
  topics: covalentLog.raw_log_topics,
  transactionHash: covalentLog.tx_hash
})

const splitBlockRangeInChunks = (chunks: [number, number][], chunkSize: number): [number, number][] => (
  chunks.flatMap(([from, to]) => (
    to - from < chunkSize
      ? [[from, to]]
      : splitBlockRangeInChunks([[from, from + chunkSize - 1], [from + chunkSize, to]], chunkSize)
  ))
)
