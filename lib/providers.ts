import ky from 'lib/ky';
import { type PublicClient, getAddress } from 'viem';
import { RequestQueue } from './api/logs/RequestQueue';
import { isNullish } from './utils';
import {
  createViemPublicClientForChain,
  getChainLogsRpcUrl,
  isBackendSupportedChain,
  isCovalentSupportedChain,
} from './utils/chains';
import { isLogResponseSizeError } from './utils/errors';
import type { Filter, Log } from './utils/events';

// It is important that we get the latest block number from the same source as the logs, otherwise we may get
// inconsistent results (e.g. if we get the latest block number from node and then request logs from Etherscan,
// the logs may be from a different blocks)
export interface LogsProvider {
  chainId: number;
  getLatestBlock(): Promise<number>;
  getLogs(filter: Filter): Promise<Array<Log>>;
}

export class DivideAndConquerLogsProvider implements LogsProvider {
  constructor(private underlyingProvider: LogsProvider) {}

  get chainId(): number {
    return this.underlyingProvider.chainId;
  }

  async getLatestBlock(): Promise<number> {
    return this.underlyingProvider.getLatestBlock();
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    // We pre-emptively split the requests for Covalent-supported chains, to limit potential downsides when
    // we potentially need to divide-and-conquer the requests down the line
    if (isCovalentSupportedChain(this.chainId) && filter.toBlock - filter.fromBlock > 5_000_000) {
      return this.divideAndConquer(filter);
    }

    try {
      const result = await this.underlyingProvider.getLogs(filter);
      return result;
    } catch (error) {
      if (!isLogResponseSizeError(error)) throw error;

      // If the block range is already a single block, we re-throw the error since we can't split it further
      if (filter.fromBlock === filter.toBlock) throw error;

      return this.divideAndConquer(filter);
    }
  }

  async divideAndConquer(filter: Filter): Promise<Log[]> {
    const middle = filter.fromBlock + Math.floor((filter.toBlock - filter.fromBlock) / 2);
    const leftPromise = this.getLogs({ ...filter, toBlock: middle });
    const rightPromise = this.getLogs({ ...filter, fromBlock: middle + 1 });
    const [left, right] = await Promise.all([leftPromise, rightPromise]);
    return [...left, ...right];
  }
}

export class BackendLogsProvider implements LogsProvider {
  queue: RequestQueue;

  constructor(public chainId: number) {
    // Limit the number of requests to the backend to 5 per second (spread out), to reduce the load on the backend
    this.queue = new RequestQueue(String(chainId), { interval: 200, intervalCap: 1 }, 'p-queue');
  }

  async getLatestBlock(): Promise<number> {
    const result = await this.queue.add(() =>
      ky.get(`/api/${this.chainId}/block`, { timeout: false }).json<{ blockNumber: number }>(),
    );

    return result.blockNumber;
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    try {
      return await this.queue.add(() =>
        ky.post(`/api/${this.chainId}/logs`, { json: filter, timeout: false }).json<any>(),
      );
    } catch (error) {
      throw new Error((error as any).data?.message ?? (error as any).message);
    }
  }
}

export class ViemLogsProvider implements LogsProvider {
  private client: PublicClient;
  private url: string;

  constructor(
    public chainId: number,
    url?: string,
  ) {
    this.url = url ?? getChainLogsRpcUrl(chainId);
    this.client = createViemPublicClientForChain(chainId, this.url);
  }

  async getLatestBlock(): Promise<number> {
    return Number(await this.client.getBlockNumber());
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    // Hypersync does not allow using `null` as a topic, so we replace it with an empty array
    if (this.url.includes('hypersync')) {
      filter.topics = filter.topics?.map((topic) => (isNullish(topic) ? [] : topic)) as Log['topics'];
    }

    const logs = await this.client.request({
      method: 'eth_getLogs',
      params: [
        { ...filter, fromBlock: `0x${filter.fromBlock.toString(16)}`, toBlock: `0x${filter.toBlock.toString(16)}` },
      ],
    });

    return (logs as any[]).map((log) => this.formatEvent(log)) as Log[];
  }

  private formatEvent(log: any): Log {
    return {
      ...log,
      address: getAddress(log.address),
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      transactionIndex: Number(log.transactionIndex),
    };
  }
}

const getUnderlyingLogsProvider = (chainId: number): BackendLogsProvider | ViemLogsProvider => {
  if (isBackendSupportedChain(chainId)) return new BackendLogsProvider(chainId);
  return new ViemLogsProvider(chainId, getChainLogsRpcUrl(chainId));
};

export const getLogsProvider = (chainId: number): DivideAndConquerLogsProvider => {
  return new DivideAndConquerLogsProvider(getUnderlyingLogsProvider(chainId));
};
