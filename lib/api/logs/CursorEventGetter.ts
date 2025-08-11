import { createViemPublicClientForChain } from 'lib/utils/chains';
import type { Filter, Log } from 'lib/utils/events';
import { type PublicClient, getAddress } from 'viem';
import type { EventGetter } from './EventGetter';

export class CursorEventGetter implements EventGetter {
  clients: { [chainId: number]: PublicClient };

  constructor(urls?: Record<number, string>) {
    this.clients = Object.fromEntries(
      Object.entries(urls ?? {}).map(([chainId, url]) => [
        Number(chainId),
        createViemPublicClientForChain(Number(chainId), url),
      ]),
    );
  }

  async getLatestBlock(chainId: number): Promise<number> {
    const client = this.clients[chainId];
    if (!client) throw new Error(`No client found for chainId ${chainId}`);
    return Number(await client.getBlockNumber());
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    try {
      const client = this.clients[chainId];
      if (!client) throw new Error(`No client found for chainId ${chainId}`);

      let cursor: string | undefined;
      const logs: Log[] = [];

      do {
        const result = (await client.request({
          method: 'eth_getLogsWithCursor' as any,
          params: [
            { ...filter, fromBlock: `0x${filter.fromBlock.toString(16)}`, toBlock: `0x${filter.toBlock.toString(16)}` },
          ],
        })) as any;

        logs.push(...result.logs.map(formatEvent));
        cursor = result.cursor;

        console.log(result);
      } while (cursor);

      return logs;
    } catch (error) {
      console.error('aaaaaaaaaa', error);
      throw error;
    }
  }
}

const formatEvent = (log: any): Log => {
  return {
    ...log,
    address: getAddress(log.address),
    blockNumber: Number(log.blockNumber),
    logIndex: Number(log.logIndex),
    transactionIndex: Number(log.transactionIndex),
  };
};
