import { Filter, Log } from '@ethersproject/abstract-provider'
import { EventGetter } from './EventGetter';
import { providers } from 'ethers';
import { getLogsFromProvider } from 'components/common/util';

export class NodeEventGetter implements EventGetter {
  private providers: { [chainId: number]: providers.JsonRpcProvider };

  constructor(nodeUrls: { [chainId: number]: string }) {
    this.providers = Object.fromEntries(
      Object.entries(nodeUrls)
        .map(([chainId, nodeUrl]) => [Number(chainId), new providers.JsonRpcProvider(nodeUrl as string)])
    )
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const provider = this.providers[chainId];
    if (!provider) return [];
    return getLogsFromProvider(provider, filter, filter.fromBlock as number, filter.toBlock as number);
  }
}
