import { isCovalentSupportedChain } from '@revoke.cash/core/chains';
import type { Filter, Log } from '@revoke.cash/core/events';
import { isLogResponseSizeError } from '@revoke.cash/core/utils/errors';
import type { LogsProvider } from './LogsProvider';

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
      return this.divideAndConquer(filter, 2);
    }

    try {
      const result = await this.underlyingProvider.getLogs(filter);
      return result;
    } catch (error) {
      if (!isLogResponseSizeError(error)) throw error;

      // If the block range is already a single block, we re-throw the error since we can't split it further
      if (filter.fromBlock === filter.toBlock) throw error;

      return this.divideAndConquer(filter, 2);
    }
  }

  async divideAndConquer(filter: Filter, iterations: number): Promise<Log[]> {
    if (iterations === 1) return this.getLogs(filter);

    const middle = filter.fromBlock + Math.floor((filter.toBlock - filter.fromBlock) / 2);
    const leftPromise = this.divideAndConquer({ ...filter, toBlock: middle }, iterations - 1);
    const rightPromise = this.divideAndConquer({ ...filter, fromBlock: middle + 1 }, iterations - 1);
    const [left, right] = await Promise.all([leftPromise, rightPromise]);
    return [...left, ...right];
  }
}
