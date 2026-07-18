import { createViemPublicClientForChain, getChainLogsRpcUrl } from '@revoke.cash/core/chains';
import type { Filter, Log } from '@revoke.cash/core/events';
import { isNullish } from '@revoke.cash/core/utils';
import { getAddress, type PublicClient } from 'viem';
import type { LogsProvider } from './LogsProvider';

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
      timestamp: isNullish(log.blockTimestamp) ? undefined : Number(log.blockTimestamp),
    };
  }
}
