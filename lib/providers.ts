import axios from 'axios';
import { PublicClient, getAddress } from 'viem';
import { RequestQueue } from './api/logs/RequestQueue';
import type { Filter, Log } from './interfaces';
import { createViemPublicClientForChain, getChainLogsRpcUrl, isBackendSupportedChain } from './utils/chains';

export class BackendLogsProvider {
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

export class ViemLogsProvider {
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

export const getLogsProvider = (chainId: number, url?: string): BackendLogsProvider | ViemLogsProvider => {
  if (isBackendSupportedChain(chainId)) return new BackendLogsProvider(chainId);
  return new ViemLogsProvider(chainId, url);
};
