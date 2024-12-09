import ky from 'lib/ky';
import { type PublicClient, getAddress } from 'viem';
import { RequestQueue } from './api/logs/RequestQueue';
import {
  createViemPublicClientForChain,
  getChainLogsRpcUrl,
  isBackendSupportedChain,
  isCovalentSupportedChain,
} from './utils/chains';
import { isLogResponseSizeError } from './utils/errors';
import type { Filter, Log } from './utils/events';

export interface LogsProvider {
  chainId: number;
  getLogs(filter: Filter): Promise<Array<Log>>;
}

export class DivideAndConquerLogsProvider implements LogsProvider {
  constructor(private underlyingProvider: LogsProvider) {}

  get chainId(): number {
    return this.underlyingProvider.chainId;
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

  constructor(
    public chainId: number,
    url?: string,
  ) {
    this.client = createViemPublicClientForChain(chainId, url ?? getChainLogsRpcUrl(chainId));
  }

  async getLogs(filter: Filter): Promise<Log[]> {
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

const getUnderlyingLogsProvider = (chainId: number, url?: string): BackendLogsProvider | ViemLogsProvider => {
  if (isBackendSupportedChain(chainId)) return new BackendLogsProvider(chainId);
  return new ViemLogsProvider(chainId, url);
};

export const getLogsProvider = (chainId: number, url?: string): DivideAndConquerLogsProvider => {
  return new DivideAndConquerLogsProvider(getUnderlyingLogsProvider(chainId, url));
};
