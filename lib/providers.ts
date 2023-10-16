import axios from 'axios';
import { PublicClient, getAddress } from 'viem';
import { RequestQueue } from './api/logs/RequestQueue';
import type { Filter, Log, LogsProvider } from './interfaces';
import { createViemPublicClientForChain, getChainLogsRpcUrl, isBackendSupportedChain } from './utils/chains';
import { isLogResponseSizeError, parseErrorMessage } from './utils/errors';

export class DivideAndConquerLogsProvider implements LogsProvider {
  constructor(private underlyingProvider: LogsProvider) {}

  async getLogs(filter: Filter): Promise<Log[]> {
    try {
      const result = await this.underlyingProvider.getLogs(filter);
      return result;
    } catch (error) {
      if (!isLogResponseSizeError(parseErrorMessage(error))) throw error;

      // If the block range is already a single block, we re-throw the error since we can't split it further
      if (filter.fromBlock === filter.toBlock) throw error;

      const middle = filter.fromBlock + Math.floor((filter.toBlock - filter.fromBlock) / 2);
      const leftPromise = this.getLogs({ ...filter, toBlock: middle });
      const rightPromise = this.getLogs({ ...filter, fromBlock: middle + 1 });
      const [left, right] = await Promise.all([leftPromise, rightPromise]);
      return [...left, ...right];
    }
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
      const { data } = await this.queue.add(() => axios.post(`/api/${this.chainId}/logs`, filter));
      return data;
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? error?.response?.data ?? error?.message);
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
