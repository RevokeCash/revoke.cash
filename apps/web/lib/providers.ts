import { getChainLogsRpcUrl, isBackendSupportedChain } from '@revoke.cash/core/chains';
import type { Filter, Log } from '@revoke.cash/core/events';
import { DivideAndConquerLogsProvider, type LogsProvider, ViemLogsProvider } from '@revoke.cash/core/events/providers';
import { RequestQueue } from '@revoke.cash/core/request-queue';
import ky from 'lib/ky';

// Routes log requests through the revoke.cash web backend for chains where that's supported (paid indexer
// API keys live there, not in the browser). Only usable from the web app; service runtimes should use
// getScriptLogsProvider instead.
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
    const body = {
      address: filter.address,
      topics: filter.topics,
      fromBlock: filter.fromBlock,
      toBlock: filter.toBlock,
    };

    try {
      return await this.queue.add(() =>
        ky.post(`/api/${this.chainId}/logs`, { json: body, timeout: false }).json<any>(),
      );
    } catch (error) {
      throw new Error((error as any).data?.message ?? (error as any).message);
    }
  }
}

const getUnderlyingLogsProvider = (chainId: number): BackendLogsProvider | ViemLogsProvider => {
  if (isBackendSupportedChain(chainId)) return new BackendLogsProvider(chainId);
  return new ViemLogsProvider(chainId, getChainLogsRpcUrl(chainId));
};

export const getLogsProvider = (chainId: number): DivideAndConquerLogsProvider => {
  return new DivideAndConquerLogsProvider(getUnderlyingLogsProvider(chainId));
};
