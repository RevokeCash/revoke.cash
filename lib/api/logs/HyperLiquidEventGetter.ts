import { retryOn429 } from 'lib/ky';
import { ViemLogsProvider } from 'lib/providers';
import { splitBlockRangeInChunks } from 'lib/utils';
import type { Filter, Log } from 'lib/utils/events';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

// The configured LogsProvider for HyperLiquid is not up to date, and the up to date one
// only supports
export class HyperLiquidEventGetter implements EventGetter {
  deepLogsProvider = new ViemLogsProvider(999, 'https://hl-archive-node.xyz');
  shallowLogsProvider = new ViemLogsProvider(999, 'https://rpc.hypurrscan.io');
  queue: RequestQueue = new RequestQueue('hyperliquid', { interval: 100, intervalCap: 3 });

  async getLatestBlock(_chainId: number): Promise<number> {
    return this.shallowLogsProvider.getLatestBlock();
  }

  async getEvents(_chainId: number, filter: Filter): Promise<Log[]> {
    const deepBlock = await this.deepLogsProvider.getLatestBlock();
    if (filter.toBlock <= deepBlock) return this.deepLogsProvider.getLogs(filter);

    const deepPromise = this.deepLogsProvider.getLogs(filter);

    const chunks = splitBlockRangeInChunks([[deepBlock, filter.toBlock]], 1000);
    const shallowPromises = chunks.map(async ([from, to]) => {
      try {
        return await retryOn429(() =>
          this.queue.add(() => this.shallowLogsProvider.getLogs({ ...filter, fromBlock: from, toBlock: to })),
        );
      } catch (error) {
        console.error(error);
        throw error;
      }
    });

    const results = await Promise.all([deepPromise, ...shallowPromises]);
    return results.flat();
  }
}
