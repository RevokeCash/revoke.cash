import { ExportableError } from '@revoke.cash/core/utils/errors';
import { getChainName } from '../chains';

// Thrown when the cache is too far behind the requested toBlock to fill the gap synchronously.
// The wallet is being actively indexed by the background scheduler; the caller should surface a
// "still indexing, check back later" message rather than serving stale partial data.
export class StillIndexingError extends ExportableError {
  readonly lastToBlock: number;
  readonly headBlock: number;
  readonly blocksRemaining: number;
  readonly progressPercent: number;

  constructor(lastToBlock: number, headBlock: number) {
    const blocksRemaining = Math.max(0, headBlock - lastToBlock);
    const progressPercent = Math.min(100, (lastToBlock / Math.max(1, headBlock)) * 100);
    super(`Still indexing this wallet. ${blocksRemaining.toLocaleString()} blocks remaining. Try again later.`);
    this.name = 'StillIndexingError';
    this.lastToBlock = lastToBlock;
    this.headBlock = headBlock;
    this.blocksRemaining = blocksRemaining;
    this.progressPercent = progressPercent;
  }

  export() {
    return {
      status: 503,
      body: {
        message: this.message,
        details: {
          lastToBlock: this.lastToBlock,
          headBlock: this.headBlock,
          blocksRemaining: this.blocksRemaining,
          progressPercent: this.progressPercent,
        },
      },
    };
  }
}

// Thrown when a single cache query returns more than `limit` rows. Postgres results larger than
// ~60MB fail at the driver level; this error lets us surface a graceful "too much activity" path
// instead of hitting that.
export class TooMuchActivityError extends ExportableError {
  readonly chainId: number;
  readonly limit: number;

  constructor(chainId: number, limit: number) {
    super(`This wallet has too much activity on ${getChainName(chainId)}, so its approvals cannot be loaded.`);
    this.name = 'TooMuchActivityError';
    this.chainId = chainId;
    this.limit = limit;
  }

  export() {
    return {
      status: 503,
      body: {
        message: this.message,
        details: { chainId: this.chainId, limit: this.limit },
      },
    };
  }
}

// Thrown by cached read paths when the background scheduler has repeatedly failed to scan this
// chain. Surfaces the stored failure instead of returning stale or empty cache data silently.
export class ChainUnresponsiveError extends ExportableError {
  readonly chainId: number;
  readonly lastError: string;

  constructor(chainId: number, lastError: string) {
    super(`${getChainName(chainId)} is currently unresponsive: ${lastError}`);
    this.name = 'ChainUnresponsiveError';
    this.chainId = chainId;
    this.lastError = lastError;
  }

  export() {
    return {
      status: 503,
      body: {
        message: this.message,
        details: { chainId: this.chainId, lastError: this.lastError },
      },
    };
  }
}
