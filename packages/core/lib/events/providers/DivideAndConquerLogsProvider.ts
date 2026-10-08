import { splitBlockRangeInChunks } from '@revoke.cash/core/blocks';
import { isCovalentSupportedChain } from '@revoke.cash/core/chains';
import type { Filter, Log } from '@revoke.cash/core/events';
import { isLogRequestSizeError, isLogResponseSizeError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { LogsProvider } from './LogsProvider';

export interface DivideAndConquerOptions {
  splitOnRequestSize?: boolean;
}

const COVALENT_PRE_SPLIT_BLOCK_RANGE = 5_000_000;

export class DivideAndConquerLogsProvider implements LogsProvider {
  constructor(
    private underlyingProvider: LogsProvider,
    private options: DivideAndConquerOptions = {},
  ) {}

  get chainId(): number {
    return this.underlyingProvider.chainId;
  }

  async getLatestBlock(): Promise<number> {
    return this.underlyingProvider.getLatestBlock();
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    // We pre-emptively split the requests for Covalent-supported chains, to limit potential downsides when
    // we potentially need to divide-and-conquer the requests down the line
    if (isCovalentSupportedChain(this.chainId) && filter.toBlock - filter.fromBlock > COVALENT_PRE_SPLIT_BLOCK_RANGE) {
      return this.getLogsInChunks(filter, COVALENT_PRE_SPLIT_BLOCK_RANGE);
    }

    try {
      const result = await this.underlyingProvider.getLogs(filter);
      return result;
    } catch (error) {
      if (!this.isSplittableError(error)) throw error;

      // If the block range cannot be split further, and the response is still too large, we throw a deliberate error for this case
      if (filter.fromBlock === filter.toBlock) {
        if (isLogResponseSizeError(error)) {
          throw new Error(`Address has too much activity: ${parseErrorMessage(error)}`);
        }

        throw error;
      }

      return this.divideAndConquer(filter, 2);
    }
  }

  // The range is capped at the latest block first, so a toBlock far beyond the chain head cannot create a huge number of chunks
  private async getLogsInChunks(filter: Filter, chunkSize: number): Promise<Log[]> {
    const toBlock = Math.min(filter.toBlock, await this.getLatestBlock());
    if (toBlock < filter.fromBlock) return [];

    const blockRanges = splitBlockRangeInChunks([[filter.fromBlock, toBlock]], chunkSize);
    const results = await Promise.all(
      blockRanges.map(([chunkFromBlock, chunkToBlock]) =>
        this.getLogs({ ...filter, fromBlock: chunkFromBlock, toBlock: chunkToBlock }),
      ),
    );

    return results.flat();
  }

  private isSplittableError(error: unknown): boolean {
    if (isLogResponseSizeError(error)) return true;
    if (this.options.splitOnRequestSize && isLogRequestSizeError(error)) return true;
    return false;
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
