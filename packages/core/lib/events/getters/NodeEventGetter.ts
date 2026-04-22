import type { Filter, Log } from '@revoke.cash/core/events';
import { DivideAndConquerLogsProvider, type LogsProvider, ViemLogsProvider } from '@revoke.cash/core/events/providers';
import type { EventGetter } from './EventGetter';

export class NodeEventGetter implements EventGetter {
  private logsProviders: { [chainId: number]: LogsProvider };

  constructor(urls?: Record<number, string>) {
    this.logsProviders = Object.fromEntries(
      Object.entries(urls ?? {}).map(([chainId, url]) => [
        Number(chainId),
        new DivideAndConquerLogsProvider(new ViemLogsProvider(Number(chainId), url)),
      ]),
    );
  }

  async getLatestBlock(chainId: number): Promise<number> {
    const logsProvider = this.logsProviders[chainId];
    if (!logsProvider) return 0;
    return logsProvider.getLatestBlock();
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const logsProvider = this.logsProviders[chainId];
    if (!logsProvider) return [];
    return logsProvider.getLogs(filter);
  }
}
