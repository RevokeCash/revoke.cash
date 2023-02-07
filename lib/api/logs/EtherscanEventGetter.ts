import type { Filter } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { utils } from 'ethers';
import type { Log } from 'lib/interfaces';
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

    const baseQuery = prepareBaseEtherscanGetLogsQuery(filter, apiKey);

    const results = [];

    // Etherscan returns pages of 1000 results, so we need to loop through all pages
    // It also has a limit of 10000 results total, so at that point we throw,
    // so it gets picked up by the recursive getLogs retrying client-side
    for (let page = 1; page < 100; page++) {
      const query = { ...baseQuery, page };

      // Send the request to Etherscan
      const { data } = await queue.add(() => axios.get(apiUrl, { params: query }));

      // Throw an error that is compatible with the recursive getLogs retrying client-side
      if (typeof data.message === 'string' && data.message.includes('Result window is too large')) {
        throw new Error('query returned more than 10000 results');
      }

      if (typeof data.result === 'string') {
        // If we hit the rate limit, we try again
        if (data.result.includes('Max rate limit reached')) {
          console.error('Rate limit reached, retrying...');
          page--;
          continue;
        }
        throw new Error(data.result);
      }

      if (!Array.isArray(data.result)) {
        console.log(data);
        throw new Error('Could not retrieve event logs from the blockchain');
      }

      results.push(...data.result);

      // If the query returned less than 1000 results, there are no more results
      if (data.result.length < 1000) break;
    }

    return results.map(formatEtherscanEvent);
  }
}

const prepareBaseEtherscanGetLogsQuery = (filter: Filter, apiKey?: string) => {
  const [topic0, topic1, topic2, topic3] = (filter.topics ?? []).map((topic) =>
    typeof topic === 'string' ? topic.toLowerCase() : topic
  );

  const query = {
    module: 'logs',
    action: 'getLogs',
    address: filter.address,
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
