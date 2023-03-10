import axios from 'axios';
import { utils } from 'ethers';
import type { Filter, Log } from 'lib/interfaces';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

export class CovalentEventGetter implements EventGetter {
  private queue: RequestQueue;

  constructor(private apiKey: string, isPremium: boolean) {
    // Covalent's premium API has a rate limit of 50 (normal = 5) requests per second, which we underestimate to be safe
    // TODO: Upstash is somehow having issues with higher rate limits, so we use 4/100ms rather than 40/1000ms
    this.queue = new RequestQueue(`covalent:${apiKey}`, { interval: isPremium ? 100 : 1000, intervalCap: 4 });
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const topics = filter.topics as string[];
    const fromBlock = filter.fromBlock as number;
    // Covalent has some issues with being up to date for recent blocks, so we'll use an older block
    const toBlock = (filter.toBlock as number) - 50;
    const blockRangeChunks = splitBlockRangeInChunks([[fromBlock, toBlock]], 1e6);

    const results = await Promise.all(
      blockRangeChunks.map(([from, to]) => this.queue.add(() => this.getEventsInChunk(chainId, from, to, topics)))
    );

    return filterLogs(results.flat(), filter);
  }

  private async getEventsInChunk(chainId: number, fromBlock: number, toBlock: number, topics: string[]) {
    const [mainTopic, ...secondaryTopics] = topics.filter((topic) => !!topic);
    const params = {
      'starting-block': fromBlock,
      'ending-block': toBlock,
      'secondary-topics': secondaryTopics.join(','),
      'page-size': 9999999,
    };

    const auth = {
      username: this.apiKey,
      password: '',
    };

    const url = `https://api.covalenthq.com/v1/${chainId}/events/topics/${mainTopic}/`;
    const result = await axios.get(url, { params, auth });
    return result?.data?.data?.items?.map(formatCovalentEvent) ?? [];
  }
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
