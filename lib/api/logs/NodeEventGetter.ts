import type { Filter, Log, LogsProvider } from 'lib/interfaces';
import { DivideAndConquerLogsProvider, ViemLogsProvider } from 'lib/providers';
import type { EventGetter } from './EventGetter';

export class NodeEventGetter implements EventGetter {
  private logsProviders: { [chainId: number]: LogsProvider };

  constructor(urls: { [chainId: number]: string }) {
    this.logsProviders = Object.fromEntries(
      Object.entries(urls).map(([chainId, url]) => [
        Number(chainId),
        new DivideAndConquerLogsProvider(new ViemLogsProvider(Number(chainId), url)),
      ]),
    );
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const logsProvider = this.logsProviders[chainId];
    if (!logsProvider) return [];
    return logsProvider.getLogs(filter);
  }
}
