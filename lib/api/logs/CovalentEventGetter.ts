import type { Filter, Log } from 'lib/interfaces';
import ky from 'lib/ky';
import { splitBlockRangeInChunks } from 'lib/utils';
import { isRateLimitError, parseErrorMessage } from 'lib/utils/errors';
import { getAddress } from 'viem';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

export class CovalentEventGetter implements EventGetter {
  private queue: RequestQueue;

  constructor(
    private apiKey: string,
    isPremium: boolean,
  ) {
    // Covalent's premium API has a rate limit of 50 (normal = 5) requests per second, which we underestimate to be safe
    this.queue = new RequestQueue(`covalent:${apiKey}`, { interval: 1000, intervalCap: isPremium ? 40 : 4 });
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const { topics, fromBlock, toBlock } = filter;
    const blockRangeChunks = splitBlockRangeInChunks([[fromBlock, toBlock]], 1e6);

    const results = await Promise.all(
      blockRangeChunks.map(([from, to]) => this.getEventsInChunk(chainId, from, to, topics)),
    );

    return filterLogs(results.flat(), filter);
  }

  private async getEventsInChunk(chainId: number, fromBlock: number, toBlock: number, topics: string[]) {
    const [mainTopic, ...secondaryTopics] = topics.filter((topic) => !!topic);
    const apiUrl = `https://api.covalenthq.com/v1/${chainId}/events/topics/${mainTopic}/`;

    const searchParams = {
      'starting-block': fromBlock === 0 ? 'earliest' : fromBlock,
      'ending-block': toBlock,
      'secondary-topics': secondaryTopics.join(','),
      'page-size': 9999999,
    };

    const headers = {
      Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
    };

    try {
      const result = await this.queue.add(() =>
        ky.get(apiUrl, { searchParams, headers, retry: 3, timeout: false }).json<any>(),
      );
      return result?.data?.items?.map(formatCovalentEvent) ?? [];
    } catch (e) {
      if (isRateLimitError(parseErrorMessage(e))) {
        console.error('Rate limit reached, retrying...');
        return this.getEventsInChunk(chainId, fromBlock, toBlock, topics);
      }

      throw new Error(e.data?.error_message ?? e.message);
    }
  }
}

const formatCovalentEvent = (covalentLog: any) => ({
  address: getAddress(covalentLog.sender_address),
  topics: covalentLog.raw_log_topics,
  data: covalentLog.raw_log_data,
  transactionHash: covalentLog.tx_hash,
  blockNumber: covalentLog.block_height,
  transactionIndex: covalentLog.tx_offset,
  logIndex: covalentLog.log_offset,
  timestamp: Math.floor(new Date(covalentLog.block_signed_at).getTime() / 1000),
});

const filterLogs = (logs: Log[], filter: Filter): Log[] => {
  const { fromBlock, toBlock } = filter;
  const topics = filter.topics.map((topic) => topic?.toLowerCase());

  const filteredLogs = logs.filter((event) => {
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
