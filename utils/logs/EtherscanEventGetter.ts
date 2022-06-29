import { Filter, Log } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { ChainId } from 'eth-chains';
import { getAddress } from 'ethers/lib/utils';
import PQueue from 'p-queue';
import { EventGetter } from './EventGetter';

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
      ? new PQueue({ intervalCap: 5, interval: 1000 })
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

    const { data } = await this.queue.add(() => this.sendRequest(query));

    if (typeof data.result === 'string') {
      throw new Error(data.result);
    }

    // If an error occurs or if the limit (1000) is reached, throw an error that is
    // compatible with the getLogsFromProvider() function to trigger recursive getLogs
    if (data.result.length === 1000) {
      throw new Error('query returned more than 10000 results');
    }

    return data.result.map(formatEtherscanEvent);
  }

  async sendRequest(params: any) {
    return axios.get(this.apiUrl, {
      params: { ...params, apikey: this.apiKey },
    });
  }
}

const formatEtherscanEvent = (etherscanLog: any) => ({
  address: getAddress(etherscanLog.address),
  topics: etherscanLog.topics,
  transactionHash: etherscanLog.transactionHash,
});

const API_URLS = {
  [ChainId.BinanceSmartChainMainnet]: 'https://api.bscscan.com/api',
  [ChainId.BinanceSmartChainTestnet]: 'https://api-testnet.bscscan.com/api',
  [ChainId.PolygonMainnet]: 'https://api.polygonscan.com/api',
  [ChainId.PolygonTestnetMumbai]: 'https://api-testnet.polygonscan.com/api',
  [ChainId.AvalancheMainnet]: 'https://api.snowtrace.io/api',
  [ChainId.AvalancheFujiTestnet]: 'https://api-testnet.snowtrace.io/api',
  [ChainId.FantomOpera]: 'https://api.ftmscan.com/api',
  [ChainId.FantomTestnet]: 'https://api-testnet.ftmscan.com/api',
  [ChainId.ArbitrumOne]: 'https://api.arbiscan.io/api',
  [ChainId.ArbitrumTestnetRinkeby]: 'https://api-testnet.arbiscan.io/api',
  [ChainId.HuobiECOChainMainnet]: 'https://api.hecoinfo.com/api',
  [ChainId.HuobiECOChainTestnet]: 'https://api-testnet.hecoinfo.com/api',
  [ChainId.Moonbeam]: 'https://api-moonbeam.moonscan.io/api',
  [ChainId.Moonriver]: 'https://api-moonriver.moonscan.io/api',
  [ChainId.MoonbaseAlpha]: 'https://api-moonbase.moonscan.io/api',
  [ChainId.CronosMainnetBeta]: 'https://api.cronoscan.com/api',
};

const getApiKey = (apiUrl: string, apiKeys: { [platform: string]: string }) => {
  const platform = new URL(apiUrl).hostname.split('.').at(-2);
  return apiKeys[platform];
};
