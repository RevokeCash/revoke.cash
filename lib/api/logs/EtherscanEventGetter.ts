import axios from 'axios';
import { utils } from 'ethers';
import type { Filter, Log } from 'lib/interfaces';
import {
  ETHERSCAN_SUPPORTED_CHAINS,
  getChainApiIdentifer,
  getChainApiKey,
  getChainApiRateLimit,
  getChainApiUrl,
} from 'lib/utils/chains';
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

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const apiUrl = getChainApiUrl(chainId);
    const apiKey = getChainApiKey(chainId);
    const queue = this.queues[chainId]!;

    const query = prepareEtherscanGetLogsQuery(filter, apiKey);
    const { data } = await queue.add(() => axios.get(apiUrl, { params: query }));

    // Throw an error that is compatible with the recursive getLogs retrying client-side if we hit the result limit
    if (data.result?.length === 1000) {
      throw new Error('query returned more than 10000 results');
    }

    if (typeof data.result === 'string') {
      // If we somehow hit the rate limit, we try again
      if (data.result.includes('Max rate limit reached')) {
        console.error('Rate limit reached, retrying...');
        return this.getEvents(chainId, filter);
      }

      throw new Error(data.result);
    }

    if (!Array.isArray(data.result)) {
      console.log(data);
      throw new Error('Could not retrieve event logs from the blockchain');
    }

    return data.result.map(formatEtherscanEvent);
  }
}

const prepareEtherscanGetLogsQuery = (filter: Filter, apiKey?: string) => {
  const [topic0, topic1, topic2, topic3] = (filter.topics ?? []).map((topic) =>
    typeof topic === 'string' ? topic.toLowerCase() : topic
  );

  const query = {
    module: 'logs',
    action: 'getLogs',
    address: undefined,
    fromBlock: filter.fromBlock ?? 0,
    toBlock: filter.toBlock ?? 'latest',
    topic0,
    topic1,
    topic2,
    topic3,
    topic0_1_opr: topic0 && topic1 ? 'and' : undefined,
    topic0_2_opr: topic0 && topic2 ? 'and' : undefined,
    topic0_3_opr: topic0 && topic3 ? 'and' : undefined,
    topic1_2_opr: topic1 && topic2 ? 'and' : undefined,
    topic1_3_opr: topic1 && topic3 ? 'and' : undefined,
    topic2_3_opr: topic2 && topic3 ? 'and' : undefined,
    offset: 1000,
    apiKey,
  };

  return query;
};

const formatEtherscanEvent = (etherscanLog: any) => ({
  address: utils.getAddress(etherscanLog.address),
  topics: etherscanLog.topics.filter((topic: string) => !!topic),
  data: etherscanLog.data,
  transactionHash: etherscanLog.transactionHash,
  blockNumber: Number.parseInt(etherscanLog.blockNumber, 16),
  transactionIndex: Number.parseInt(etherscanLog.transactionIndex, 16),
  logIndex: Number.parseInt(etherscanLog.logIndex, 16),
  timestamp: Number.parseInt(etherscanLog.timeStamp, 16),
});
