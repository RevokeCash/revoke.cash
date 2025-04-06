import ky from 'lib/ky';
import { isNullish, splitBlockRangeInChunks } from 'lib/utils';
import { isRateLimitError } from 'lib/utils/errors';
import type { Filter, Log } from 'lib/utils/events';
import { getAddress } from 'viem';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

export class CovalentEventGetter implements EventGetter {
  private queue: RequestQueue;

  constructor(
    private apiKey?: string,
    isPremium: boolean = false,
  ) {
    // Covalent's premium API has a rate limit of 50 (normal = 5) requests per second, which we underestimate to be safe
    this.queue = new RequestQueue(`covalent:${apiKey}`, { interval: 1000, intervalCap: isPremium ? 40 : 4 });
  }

  async getLatestBlock(chainId: number): Promise<number> {
    if (!this.apiKey) throw new Error('Covalent API key is not set');

    const apiUrl = `https://api.covalenthq.com/v1/${chainId}/block_v2/latest/`;
    const headers = this.getHeaders();
    const result = await this.queue.add(() => ky.get(apiUrl, { headers, retry: 3, timeout: false }).json<any>());

    const blockNumber = result?.data?.items[0]?.height;
    if (!blockNumber) throw new Error('Failed to get latest block number');

    // Covalent might still have slight delay so we subtract 20 to be safe
    return blockNumber - 20;
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    if (!this.apiKey) throw new Error('Covalent API key is not set');

    const { topics, fromBlock, toBlock } = filter;
    const blockRangeChunks = splitBlockRangeInChunks([[fromBlock, toBlock]], 1e6);

    const results = await Promise.all(
      blockRangeChunks.map(([from, to]) => this.getEventsInChunk(chainId, from, to, topics)),
    );

    return filterLogs(results.flat(), filter);
  }

  private async getEventsInChunk(
    chainId: number,
    fromBlock: number,
    toBlock: number,
    topics: Array<string | null>,
  ): Promise<Log[]> {
    const [mainTopic, ...secondaryTopics] = topics.filter((topic) => !isNullish(topic));
    const apiUrl = `https://api.covalenthq.com/v1/${chainId}/events/topics/${mainTopic}/`;

    const searchParams = {
      'starting-block': fromBlock === 0 ? 'earliest' : fromBlock,
      'ending-block': toBlock,
      'page-size': 9999999,
      ...(secondaryTopics.length > 0 ? { 'secondary-topics': secondaryTopics.join(',') } : {}),
    };

    const headers = this.getHeaders();

    try {
      const result = await this.queue.add(() =>
        ky.get(apiUrl, { searchParams, headers, retry: 3, timeout: false }).json<any>(),
      );
      return result?.data?.items?.map(formatCovalentEvent) ?? [];
    } catch (e) {
      if (isRateLimitError(e)) {
        console.error('Covalent: Rate limit reached, retrying...');
        return this.getEventsInChunk(chainId, fromBlock, toBlock, topics);
      }

      throw new Error((e as any).data?.error_message ?? (e as any).message);
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
    };
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
  const { address, fromBlock, toBlock } = filter;
  const topics = filter.topics.map((topic) => topic?.toLowerCase());

  const filteredLogs = logs.filter((event) => {
    if (fromBlock && event.blockNumber < fromBlock) return false;
    if (toBlock && event.blockNumber > toBlock) return false;
    if (address && event.address !== address) return false;
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
