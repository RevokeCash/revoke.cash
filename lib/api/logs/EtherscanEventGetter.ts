import type { Filter, Log } from '@ethersproject/abstract-provider';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import axios from 'axios';
import { ChainId } from 'eth-chains';
import { utils } from 'ethers';
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

  async getLogs(filter: Filter) {
    const [topic0, topic1, topic2, topic3] = filter.topics ?? [];
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
      topic0_1_opr: 'and',
      topic0_2_opr: 'and',
      topic0_3_opr: 'and',
      topic1_2_opr: 'and',
      topic1_3_opr: 'and',
      topic2_3_opr: 'and',
    };

    // If we have upstash configured, we use it, otherwise fall back to an in-memory p-queue
    const { data } = upstashRateLimiter
      ? await this.sendRequestWithUpstashQueue(query)
      : await this.queue.add(() => this.sendRequest(query));

    if (typeof data.result === 'string') {
      throw new Error(data.result);
    }

    // If the limit (1000) is reached, throw an error that is
    // compatible with the getLogsFromProvider() function to trigger recursive getLogs
    if (data.result.length === 1000) {
      throw new Error('query returned more than 10000 results');
    }

    return data.result.map(formatEtherscanEvent);
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

const formatEtherscanEvent = (etherscanLog: any) => ({
  address: utils.getAddress(etherscanLog.address),
  topics: etherscanLog.topics,
  transactionHash: etherscanLog.transactionHash,
});

const API_URLS = {
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
};

const getApiKey = (apiUrl: string, apiKeys: { [platform: string]: string }) => {
  const platform = new URL(apiUrl).hostname.split('.').at(-2);
  const subPlatform = new URL(apiUrl).hostname.split('.').at(-3)?.split('-').at(-1);

  return apiKeys[`${subPlatform}.${platform}`] ?? apiKeys[platform];
};
