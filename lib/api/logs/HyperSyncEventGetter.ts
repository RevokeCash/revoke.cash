import type { Event } from '@envio-dev/hypersync-client';
import { ViemLogsProvider } from 'lib/providers';
import { isNullish } from 'lib/utils';
import type { Filter, Log } from 'lib/utils/events';
import { type Hash, type Hex, getAddress } from 'viem';
import type { EventGetter } from './EventGetter';

export class HyperSyncEventGetter implements EventGetter {
  async getLatestBlock(chainId: number): Promise<number> {
    const url = `https://${chainId}.rpc.hypersync.xyz`;
    const logsProvider = new ViemLogsProvider(chainId, url);
    return logsProvider.getLatestBlock();
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    // We run into issues with webpack when importing the hypersync client directly
    const { BlockField, HypersyncClient, LogField } = await import('@envio-dev/hypersync-client');
    const url = `https://${chainId}.hypersync.xyz`;
    const client = HypersyncClient.new({
      url,
      bearerToken: process.env.HYPERSYNC_API_KEY,
    });

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
