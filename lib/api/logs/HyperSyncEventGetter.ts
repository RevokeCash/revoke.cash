import type { Event, HypersyncClient } from '@envio-dev/hypersync-client';
import { isNullish } from 'lib/utils';
import type { Filter, Log } from 'lib/utils/events';
import { getAddress, type Hash, type Hex } from 'viem';
import type { EventGetter } from './EventGetter';

export class HyperSyncEventGetter implements EventGetter {
  async getClient(chainId: number): Promise<HypersyncClient> {
    const { HypersyncClient } = await import('@envio-dev/hypersync-client');

    const url = `https://${chainId}.hypersync.xyz`;
    const client = HypersyncClient.new({
      url,
      bearerToken: process.env.HYPERSYNC_API_KEY,
    });

    return client;
  }

  async getLatestBlock(chainId: number): Promise<number> {
    const client = await this.getClient(chainId);
    return client.getHeight();
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const { BlockField, LogField } = await import('@envio-dev/hypersync-client');
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
            LogField.Address,
            LogField.Data,
            LogField.Topic0,
            LogField.Topic1,
            LogField.Topic2,
            LogField.Topic3,
            LogField.BlockNumber,
            LogField.TransactionHash,
            LogField.LogIndex,
            LogField.TransactionIndex,
          ],
          block: [BlockField.Timestamp],
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
