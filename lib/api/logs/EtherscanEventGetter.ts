import type { Filter } from '@ethersproject/abstract-provider';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import axios from 'axios';
import { ChainId } from 'eth-chains';
import { utils } from 'ethers';
import type { Log } from 'lib/interfaces';
import PQueue from 'p-queue';
import type { EventGetter } from './EventGetter';

const upstashRateLimiter =
  process.env.UPSTASH_REDIS_REST_URL &&
  new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(4, '1 s'),
  });

export class EtherscanEventGetter implements EventGetter {
  private queues: { [chainId: number]: EtherscanQueue };

  constructor(apiKeys: { [platform: string]: string }) {
    const queueEntries = Object.keys(API_URLS).map((chainId) => [
      chainId,
      new EtherscanQueue(Number.parseInt(chainId, 10), apiKeys),
    ]);
    this.queues = Object.fromEntries(queueEntries);
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const queue = this.queues[chainId]!;
    const results = await queue.getLogs(filter);
    return results;
  }
}

class EtherscanQueue {
  queue: PQueue;
  apiKey: string;

  get apiUrl(): string {
    return API_URLS[this.chainId];
  }

  constructor(public chainId: number, apiKeys: { [platform: string]: string }) {
    this.apiKey = getApiKey(this.apiUrl, apiKeys);
    console.log(chainId, this.apiKey);

    // If no API key is found we still function, but performance is severely degraded
    this.queue = this.apiKey
      ? new PQueue({ intervalCap: 4, interval: 1000 })
      : new PQueue({ intervalCap: 1, interval: 5000 });
  }

  // TODO: Refactor this to have less nesting and be more readable
  async getLogs(filter: Filter) {
    const baseQuery = prepareBaseEtherscanGetLogsQuery(filter);

    const results = [];

    // Etherscan returns pages of 1000 results, so we need to loop through all pages
    // It also has a limit of 10000 results total, so at that point we throw,
    // so it gets picked up by the recursive getLogs retrying client-side
    for (let page = 1; page < 100; page++) {
      const query = { ...baseQuery, page };

      // If we have upstash configured, we use it, otherwise fall back to an in-memory p-queue
      const { data } = upstashRateLimiter
        ? await this.sendRequestWithUpstashQueue(query)
        : await this.queue.add(() => this.sendRequest(query));

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

  async sendRequestWithUpstashQueue(params: any) {
    const { success } = await upstashRateLimiter.blockUntilReady(`etherscan:${this.apiKey}`, 30_000);

    if (!success) {
      throw new Error('Request timed out');
    }

    return this.sendRequest(params);
  }

  async sendRequest(params: any) {
    return axios.get(this.apiUrl, {
      params: { ...params, apikey: this.apiKey },
    });
  }
}

const prepareBaseEtherscanGetLogsQuery = (filter: Filter) => {
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

const API_URLS = {
  [ChainId.EthereumMainnet]: 'https://api.etherscan.io/api',
  [ChainId.BinanceSmartChainMainnet]: 'https://api.bscscan.com/api',
  [ChainId.BinanceSmartChainTestnet]: 'https://api-testnet.bscscan.com/api',
  [ChainId.PolygonMainnet]: 'https://api.polygonscan.com/api',
  [ChainId.Mumbai]: 'https://api-testnet.polygonscan.com/api',
  [ChainId['AvalancheC-Chain']]: 'https://api.snowtrace.io/api',
  [ChainId.AvalancheFujiTestnet]: 'https://api-testnet.snowtrace.io/api',
  [ChainId.FantomOpera]: 'https://api.ftmscan.com/api',
  [ChainId.FantomTestnet]: 'https://api-testnet.ftmscan.com/api',
  [ChainId.ArbitrumOne]: 'https://api.arbiscan.io/api',
  [421613]: 'https://api-goerli.arbiscan.io/api',
  [42170]: 'https://api-nova.arbiscan.io/api',
  [ChainId.HuobiECOChainMainnet]: 'https://api.hecoinfo.com/api',
  [ChainId.HuobiECOChainTestnet]: 'https://api-testnet.hecoinfo.com/api',
  [ChainId.Moonbeam]: 'https://api-moonbeam.moonscan.io/api',
  [ChainId.Moonriver]: 'https://api-moonriver.moonscan.io/api',
  [ChainId.MoonbaseAlpha]: 'https://api-moonbase.moonscan.io/api',
  [ChainId.CronosMainnetBeta]: 'https://api.cronoscan.com/api',
  [ChainId.CronosTestnet]: 'https://api-testnet.cronoscan.com/api',
  [ChainId.CeloMainnet]: 'https://api.celoscan.io/api',
  [ChainId.CeloAlfajoresTestnet]: 'https://api-alfajores.celoscan.io/api',
  [ChainId.AuroraMainnet]: 'https://api.aurorascan.dev/api',
  [ChainId.AuroraTestnet]: 'https://api-testnet.aurorascan.dev/api',
  [ChainId.BitTorrentChainMainnet]: 'https://api.bttcscan.com/api',
  [ChainId.BitTorrentChainTestnet]: 'https://api-testnet.bttcscan.com/api',
  [ChainId.CLVParachain]: 'https://api.clvscan.com/api',
  [7700]: 'https://evm.explorer.canto.io/api',
  [ChainId.KavaEVM]: 'https://explorer.kava.io/api',
  [ChainId.KavaEVMTestnet]: 'https://explorer.testnet.kava.io/api',
  [2000]: 'https://explorer.dogechain.dog/api',
  [568]: 'https://explorer-testnet.dogechain.dog/api',
  [ChainId.RSKMainnet]: 'https://blockscout.com/rsk/mainnet/api',
  [ChainId.EmeraldParatimeMainnet]: 'https://explorer.emerald.oasis.dev/api',
  [ChainId.Evmos]: 'https://evm.evmos.org/api',
  [ChainId.FuseMainnet]: 'https://explorer.fuse.io/api',
  [ChainId.Shiden]: 'https://blockscout.com/shiden/api',
  [ChainId.Astar]: 'https://blockscout.com/astar/api',
  [ChainId.Palm]: 'https://explorer.palm.io/api',
  [ChainId.CallistoMainnet]: 'https://explorer.callisto.network/api',
  [ChainId.NahmiiMainnet]: 'https://explorer.nahmii.io/api',
};

const getApiKey = (apiUrl: string, apiKeys: { [platform: string]: string }) => {
  const platform = new URL(apiUrl).hostname.split('.').at(-2);
  const subPlatform = new URL(apiUrl).hostname.split('.').at(-3)?.split('-').at(-1);

  return apiKeys[`${subPlatform}.${platform}`] ?? apiKeys[platform];
};
