import ky, { retryOn429 } from 'lib/ky';
import { isNullish } from 'lib/utils';
import type { Filter, Log } from 'lib/utils/events';
import { getAddress } from 'viem';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

// This file is modified from the EtherscanEventGetter file

interface LogsResponse {
  code: number;
  success: boolean;
  total_count: number;
  more: boolean;
  message: string;
  results: Log[];
}

interface LatestBlockResponse {
  code: number;
  success: boolean;
  message: string;
  results: Array<{
    blockNumber: number;
  }>;
}

export class TeloscanEventGetter implements EventGetter {
  queue: RequestQueue;
  apiUrl: string = 'https://api.teloscan.io/v1';

  constructor() {
    this.queue = new RequestQueue('teloscan', { interval: 1000, intervalCap: 5 });
  }

  async getLatestBlock(_chainId: number): Promise<number> {
    const { apiUrl, searchParams } = prepareTeloscanGetLatestBlockQuery(this.apiUrl);
    const result = await this.queue.add(() =>
      ky.get(apiUrl, { searchParams, retry: 3, timeout: false }).json<LatestBlockResponse>(),
    );

    const blockNumber = result?.results[0]?.blockNumber;
    if (!blockNumber) throw new Error('Failed to get latest block number');

    return blockNumber;
  }

  async getEvents(_chainId: number, filter: Filter, page: number = 0): Promise<Log[]> {
    const { apiUrl, searchParams } = prepareTeloscanGetLogsQuery(filter, page, this.apiUrl);

    let data: LogsResponse;
    try {
      data = await retryOn429(() =>
        this.queue.add(() => ky.get(apiUrl, { searchParams, retry: 3, timeout: false }).json<LogsResponse>()),
      );
    } catch (e) {
      console.log(e);
      console.log(`${apiUrl}?${new URLSearchParams(searchParams).toString()}`);
      throw new Error('Could not retrieve event logs from the blockchain');
    }

    if (!data.success) {
      throw new Error(data.message);
    }

    if (data.more) {
      if (page === 25) throw new Error('Could not retrieve event logs from the blockchain');
      return [...data.results.map(formatTeloscanEvent), ...(await this.getEvents(_chainId, filter, page + 1))];
    }

    return (
      data.results
        .map(formatTeloscanEvent)
        // Since the Teloscan API does not support querying by block number, we filter the logs here
        .filter((log) => log.blockNumber >= filter.fromBlock && log.blockNumber <= filter.toBlock)
    );
  }
}

const prepareTeloscanGetLatestBlockQuery = (baseUrl: string) => {
  return { apiUrl: `${baseUrl}/blocks`, searchParams: { limit: 1 } };
};

const prepareTeloscanGetLogsQuery = (filter: Filter, page: number, baseUrl: string) => {
  const [topic0, ...topics] = (filter.topics ?? []).map((topic) =>
    typeof topic === 'string' ? topic.toLowerCase() : topic,
  );

  const entries = topics
    .map((topic, index) => [`topics[${index + 2}]`, topic] as const)
    .filter((entry) => !isNullish(entry[1]))
    .map(([key, value]) => ({ [key]: { _eq: value } }));

  const query = {
    topics: entries.length > 1 ? JSON.stringify({ _and: entries }) : JSON.stringify(entries[0]),
    contract: filter.address,
    includePagination: true,
    limit: 1000,
    offset: page * 1000,
  };

  return {
    apiUrl: `${baseUrl}/event/${topic0}/logs`,
    searchParams: JSON.parse(JSON.stringify(query)),
  };
};

const formatTeloscanEvent = (teloscanLog: Log) => ({
  address: getAddress(teloscanLog.address),
  topics: teloscanLog.topics,
  data: teloscanLog.data,
  transactionHash: teloscanLog.transactionHash,
  blockNumber: teloscanLog.blockNumber,
  transactionIndex: teloscanLog.transactionIndex,
  logIndex: teloscanLog.logIndex,
  timestamp: teloscanLog.timestamp ? Math.floor(teloscanLog.timestamp / 1000) : undefined,
});
