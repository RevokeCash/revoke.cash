import type { Filter, Log } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { utils } from 'ethers';
import PQueue from 'p-queue';
import type { EventGetter } from './EventGetter';

// TODO: Migrate to Upstash
export class CovalentEventGetter implements EventGetter {
  // Set up a shared queue that limits the global number of requests sent to Covalent to 5/s (API rate limit)
  private queues: CovalentQueue[];

  constructor(apiKeys: string[]) {
    this.queues = apiKeys.map((key) => new CovalentQueue(key));
  }

  // TODO: Currently works with up to 2 topics (and doesn't take topic position into account)
  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const blockRangeChunks = splitBlockRangeInChunks([[filter.fromBlock as number, filter.toBlock as number]], 1e6);

    const results = await Promise.all(
      blockRangeChunks.map(([from, to]) => {
        // Send requests to the "emptiest" queue first
        const [queue] = this.queues.sort((a, b) => a.queue.size - b.queue.size);
        return queue.queue.add(() => this.getEventsInChunk(chainId, from, to, filter.topics as string[], queue.apiKey));
      })
    );

    return results.flat();
  }

  private async getEventsInChunk(
    chainId: number,
    fromBlock: number,
    toBlock: number,
    topics: string[],
    apiKey: string
  ) {
    const [mainTopic, ...secondaryTopics] = topics.filter((topic) => !!topic);
    const url = `https://api.covalenthq.com/v1/${chainId}/events/topics/${mainTopic}/?key=${apiKey}&starting-block=${fromBlock}&ending-block=${toBlock}&secondary-topics=${secondaryTopics}&page-size=9999999`;
    const result = await axios.get(url);
    return result?.data?.data?.items?.map(formatCovalentEvent) ?? [];
  }
}

class CovalentQueue {
  queue: PQueue = new PQueue({ intervalCap: 5, interval: 1000 });
  constructor(public apiKey: string) {}
}

const formatCovalentEvent = (covalentLog: any) => ({
  address: utils.getAddress(covalentLog.sender_address),
  topics: covalentLog.raw_log_topics,
  transactionHash: covalentLog.tx_hash,
});

const splitBlockRangeInChunks = (chunks: [number, number][], chunkSize: number): [number, number][] =>
  chunks.flatMap(([from, to]) =>
    to - from < chunkSize
      ? [[from, to]]
      : splitBlockRangeInChunks(
          [
            [from, from + chunkSize - 1],
            [from + chunkSize, to],
          ],
          chunkSize
        )
  );
