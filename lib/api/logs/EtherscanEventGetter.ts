import ky, { retryOn429 } from 'lib/ky';
import { ViemLogsProvider } from 'lib/providers';
import { isNullish } from 'lib/utils';
import {
  ETHERSCAN_SUPPORTED_CHAINS,
  getChainApiIdentifer,
  getChainApiKey,
  getChainApiRateLimit,
  getChainApiUrl,
  getChainLogsRpcUrl,
} from 'lib/utils/chains';
import { isLogResponseSizeError } from 'lib/utils/errors';
import type { Filter, Log } from 'lib/utils/events';
import { type Address, type Hash, type Hex, getAddress } from 'viem';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

interface LogsResponse {
  status: string;
  message: string;
  result: string | Array<EtherscanLog>;
}

interface EtherscanLog {
  address: Address;
  blockNumber: Hex;
  timeStamp: Hex;
  topics: [topic0: Hex, ...rest: Hex[]];
  data: Hex;
  transactionHash: Hash;
  transactionIndex: Hex;
  logIndex: Hex;
}

interface LatestBlockResponse {
  status: string;
  message: string;
  result: string;
}

export class EtherscanEventGetter implements EventGetter {
  protected queues: { [chainId: number]: RequestQueue };

  constructor() {
    const queueEntries = ETHERSCAN_SUPPORTED_CHAINS.map((chainId) => [
      chainId,
      new RequestQueue(getChainApiIdentifer(chainId), getChainApiRateLimit(chainId)),
    ]);
    this.queues = Object.fromEntries(queueEntries);
  }

  async getLatestBlock(chainId: number): Promise<number> {
    const apiUrl = getChainApiUrl(chainId)!;
    const apiKey = getChainApiKey(chainId);
    const queue = this.queues[chainId]!;

    const searchParams = prepareGetLatestBlockQuery(apiKey);

    const result = await retryOn429(() =>
      queue.add(() => ky.get(apiUrl, { searchParams, retry: 3, timeout: false }).json<LatestBlockResponse>()),
    );

    const blockNumber = Number(result.result);
    if (!blockNumber) {
      console.log(`${apiUrl}?${new URLSearchParams(searchParams).toString()}`);
      throw new Error('Failed to get latest block number');
    }
    return blockNumber;
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const apiUrl = getChainApiUrl(chainId)!;
    const apiKey = getChainApiKey(chainId);
    const queue = this.queues[chainId]!;

    const searchParams = prepareGetLogsQuery(filter, apiKey);

    let data: LogsResponse;
    try {
      data = await retryOn429(() =>
        queue.add(() => ky.get(apiUrl, { searchParams, retry: 3, timeout: false }).json<LogsResponse>()),
      );
    } catch (e) {
      console.log(e);
      console.log(`${apiUrl}?${new URLSearchParams(searchParams).toString()}`);

      if (isLogResponseSizeError(e)) throw new Error('Log response size exceeded');

      throw new Error('Could not retrieve event logs from the blockchain');
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

    // Throw an error that is compatible with the recursive getLogs retrying client-side if we hit the result limit
    if (data.result?.length === 1000) {
      // If the result size is still too large when looking at events for a single block, we use the "regular"
      // RPC call to get the logs, since these generally have no problem when only looking at a single block
      if (filter.fromBlock === filter.toBlock) {
        const backupLogsProvider = new ViemLogsProvider(chainId, getChainLogsRpcUrl(chainId));
        return await backupLogsProvider.getLogs(filter);
      }

      throw new Error('Log response size exceeded');
    }

    return data.result.map(formatEtherscanEvent);
  }
}

const prepareGetLatestBlockQuery = (apiKey?: string) => {
  const timestamp = Math.floor(Date.now() / 1000);

  const query = {
    module: 'block',
    action: 'getblocknobytime',
    timestamp: String(timestamp),
    closest: 'before',
    apiKey,
  };

  // Remove 'undefined' values from the query
  return JSON.parse(JSON.stringify(query));
};

const prepareGetLogsQuery = (filter: Filter, apiKey?: string) => {
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
    page: String(1),
    apiKey,
  };

  // Remove 'undefined' values from the query
  return JSON.parse(JSON.stringify(query));
};

const formatEtherscanEvent = (etherscanLog: EtherscanLog): Log => ({
  address: getAddress(etherscanLog.address),
  topics: etherscanLog.topics.filter((topic: string) => !isNullish(topic)) as [topic0: Hex, ...rest: Hex[]],
  data: etherscanLog.data,
  transactionHash: etherscanLog.transactionHash,
  blockNumber: Number(etherscanLog.blockNumber) || 0,
  transactionIndex: Number(etherscanLog.transactionIndex) || 0,
  logIndex: Number(etherscanLog.logIndex) || 0,
  timestamp: Number(etherscanLog.timeStamp) || undefined,
});
