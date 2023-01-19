import type { Filter } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { utils } from 'ethers';
import type { Log } from 'lib/interfaces';
import PQueue from 'p-queue';
import type { EventGetter } from './EventGetter';

// TODO: Migrate to Upstash
export class CovalentEventGetter implements EventGetter {
  // Set up a shared queue that limits the global number of requests sent to Covalent to 5/s (API rate limit)
  private queues: CovalentQueue[];

  constructor(apiKeys: string[]) {
    this.queues = apiKeys.map((key) => new CovalentQueue(key));
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const fromBlock = filter.fromBlock as number;
    // Covalent has some issues with being up to date for recent blocks, so we'll use an older block
    // TODO: Don't use Covalent anymore
    const toBlock = (filter.toBlock as number) - 50;
    const blockRangeChunks = splitBlockRangeInChunks([[fromBlock, toBlock]], 1e6);

    const results = await Promise.all(
      blockRangeChunks.map(([from, to]) => {
        // Send requests to the "emptiest" queue first
        const [queue] = this.queues.sort((a, b) => a.queue.size - b.queue.size);
        return queue.queue.add(() => this.getEventsInChunk(chainId, from, to, filter.topics as string[], queue.apiKey));
      })
    );

    return filterLogs(results.flat(), filter);
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
  data: covalentLog.raw_log_data,
  transactionHash: covalentLog.tx_hash,
  blockNumber: covalentLog.block_height,
  transactionIndex: covalentLog.tx_offset,
  logIndex: covalentLog.log_offset,
  timestamp: Math.floor(new Date(covalentLog.block_signed_at).getTime() / 1000),
});

const filterLogs = (logs: Log[], filter: Filter): Log[] => {
  const fromBlock = filter.fromBlock as number;
  const toBlock = filter.toBlock as number;
  const topics = (filter.topics as string[]).map((topic) => topic?.toLowerCase());
  const address = filter.address;

  const filteredLogs = logs.filter((event) => {
    if (address && event.address !== address) return false;
    if (fromBlock && event.blockNumber < fromBlock) return false;
    if (toBlock && event.blockNumber > toBlock) return false;
    if (topics) {
      if (topics[0] && event.topics[0] !== topics[0]) return false;
      if (topics[1] && event.topics[1] !== topics[1]) return false;
      if (topics[2] && event.topics[2] !== topics[2]) return false;
      if (topics[3] && event.topics[3] !== topics[3]) return false;
    }
    return true;
  });

  return filteredLogs;
};
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
