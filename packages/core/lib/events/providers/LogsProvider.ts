import type { Filter, Log } from '@revoke.cash/core/events';

// It is important that we get the latest block number from the same source as the logs, otherwise we may get
// inconsistent results (e.g. if we get the latest block number from node and then request logs from Etherscan,
// the logs may be from a different blocks)
export interface LogsProvider {
  chainId: number;
  getLatestBlock(): Promise<number>;
  getLogs(filter: Filter): Promise<Array<Log>>;
}
