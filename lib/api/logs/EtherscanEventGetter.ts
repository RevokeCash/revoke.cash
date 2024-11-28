import ky from 'lib/ky';
import { isNullish } from 'lib/utils';
import {
  ETHERSCAN_SUPPORTED_CHAINS,
  getChainApiIdentifer,
  getChainApiKey,
  getChainApiRateLimit,
  getChainApiUrl,
} from 'lib/utils/chains';
import type { Filter, Log } from 'lib/utils/events';
import { getAddress } from 'viem';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

export class EtherscanEventGetter implements EventGetter {
  private queues: { [chainId: number]: RequestQueue };

  constructor() {
    const queueEntries = ETHERSCAN_SUPPORTED_CHAINS.map((chainId) => [
      chainId,
      new RequestQueue(getChainApiIdentifer(chainId), getChainApiRateLimit(chainId)),
    ]);
    this.queues = Object.fromEntries(queueEntries);
  }

  async getEvents(chainId: number, filter: Filter, page: number = 1): Promise<Log[]> {
    const apiUrl = getChainApiUrl(chainId)!;
    const apiKey = getChainApiKey(chainId);
    const queue = this.queues[chainId]!;

    const searchParams = prepareEtherscanGetLogsQuery(filter, page, apiKey);

    let data: any;
    try {
      data = await retryOn429(() =>
        queue.add(() => ky.get(apiUrl, { searchParams, retry: 3, timeout: false }).json<any>()),
      );
    } catch (e) {
      console.log(e);
      console.log(apiUrl + '?' + new URLSearchParams(searchParams).toString());
      throw new Error('Could not retrieve event logs from the blockchain');
    }

    // Throw an error that is compatible with the recursive getLogs retrying client-side if we hit the result limit
    if (data.result?.length === 1000) {
      // If we cannot split this block range further, we use Etherscan's pagination in the hope that it does not exceed
      // 10 pages of results
      if (filter.fromBlock === filter.toBlock) {
        return [...data.result.map(formatEtherscanEvent), ...(await this.getEvents(chainId, filter, page + 1))];
      }

      throw new Error('Log response size exceeded');
    }

    if (typeof data.result === 'string') {
      // If we somehow hit the rate limit, we try again
      if (
        data.result.includes('Max rate limit reached') ||
        data.result.includes('Max calls per sec rate limit reached')
      ) {
        console.error('Etherscan: Rate limit reached, retrying...');
        return this.getEvents(chainId, filter);
      }

      // If the query times out, this indicates that we should try again with a smaller block range
      if (data.result.includes('Query Timeout occured')) {
        throw new Error('Log response size exceeded');
      }

      throw new Error(data.result);
    }

    if (typeof data.message === 'string') {
      // Routescan / Snowtrace will report a timeout if the range is too large
      if (isNullish(data?.result) && data.message.includes('Timeout reached')) {
        throw new Error('Log response size exceeded');
      }
    }

    if (!Array.isArray(data.result)) {
      console.log(data);
      throw new Error('Could not retrieve event logs from the blockchain');
    }

    return data.result.map(formatEtherscanEvent);
  }
}

const prepareEtherscanGetLogsQuery = (filter: Filter, page: number, apiKey?: string) => {
  const [topic0, topic1, topic2, topic3] = (filter.topics ?? []).map((topic) =>
    typeof topic === 'string' ? topic.toLowerCase() : topic,
  );

  const query = {
    module: 'logs',
    action: 'getLogs',
    address: filter.address ?? undefined,
    fromBlock: String(filter.fromBlock ?? 0),
    toBlock: String(filter.toBlock ?? 'latest'),
    topic0: topic0 ?? undefined,
    topic1: topic1 ?? undefined,
    topic2: topic2 ?? undefined,
    topic3: topic3 ?? undefined,
    topic0_1_opr: topic0 && topic1 ? 'and' : undefined,
    topic0_2_opr: topic0 && topic2 ? 'and' : undefined,
    topic0_3_opr: topic0 && topic3 ? 'and' : undefined,
    topic1_2_opr: topic1 && topic2 ? 'and' : undefined,
    topic1_3_opr: topic1 && topic3 ? 'and' : undefined,
    topic2_3_opr: topic2 && topic3 ? 'and' : undefined,
    offset: String(1000),
    apiKey,
    page: String(page),
  };

  // Remove 'undefined' values from the query
  return JSON.parse(JSON.stringify(query));
};

const formatEtherscanEvent = (etherscanLog: any) => ({
  address: getAddress(etherscanLog.address),
  topics: etherscanLog.topics.filter((topic: string) => !isNullish(topic)),
  data: etherscanLog.data,
  transactionHash: etherscanLog.transactionHash,
  blockNumber: Number.parseInt(etherscanLog.blockNumber, 16),
  transactionIndex: Number.parseInt(etherscanLog.transactionIndex, 16),
  logIndex: Number.parseInt(etherscanLog.logIndex, 16),
  timestamp: Number.parseInt(etherscanLog.timeStamp, 16),
});

// Certain Blockscout instances will return a 429 error if we hit the rate limit instead of a 200 response with the error message
const retryOn429 = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if ((e as any).message.includes('429')) {
      console.error('Etherscan: Rate limit reached, retrying...');
      return retryOn429(fn);
    }

    throw e;
  }
};
