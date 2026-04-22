import type { Event, HypersyncClient } from '@envio-dev/hypersync-client';
import { isNullish } from 'lib/utils';
import type { Filter, Log } from 'lib/utils/events';
import { getAddress, type Hash, type Hex } from 'viem';
import type { EventGetter } from './EventGetter';

export class HyperSyncEventGetter implements EventGetter {
  async getClient(chainId: number): Promise<HypersyncClient> {
    const { HypersyncClient } = await import('@envio-dev/hypersync-client');

    if (!process.env.HYPERSYNC_API_KEY) {
      throw new Error('HYPERSYNC_API_KEY is not set');
    }

    const url = `https://${chainId}.hypersync.xyz`;
    const client = new HypersyncClient({
      url,
      apiToken: process.env.HYPERSYNC_API_KEY,
    });

    return client;
  }

  async getLatestBlock(chainId: number): Promise<number> {
    const client = await this.getClient(chainId);
    return client.getHeight();
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const client = await this.getClient(chainId);

    const eventResponse = await client.collectEvents(
      {
        fromBlock: filter.fromBlock,
        toBlock: filter.toBlock,
        logs: [
          {
            address: filter.address ? [filter.address] : undefined,
            topics: filter.topics.map((topic) => (topic ? [topic] : [])),
          },
        ],
        fieldSelection: {
          log: [
            'Address',
            'Data',
            'Topic0',
            'Topic1',
            'Topic2',
            'Topic3',
            'BlockNumber',
            'TransactionHash',
            'LogIndex',
            'TransactionIndex',
          ],
          block: ['Timestamp'],
        },
      },
      {},
    );

    return eventResponse.data.map(formatEvent);
  }
}

const formatEvent = (event: Event): Log => {
  return {
    address: getAddress(event.log.address!),
    topics: event.log.topics.filter((topic: any) => !isNullish(topic)) as [topic0: Hex, ...rest: Hex[]],
    data: event.log.data as Hex,
    blockNumber: event.log.blockNumber as number,
    transactionHash: event.log.transactionHash as Hash,
    transactionIndex: event.log.transactionIndex as number,
    logIndex: event.log.logIndex as number,
    timestamp: event.block?.timestamp,
  };
};
