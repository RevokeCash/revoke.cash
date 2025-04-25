import { getEventGetter } from './api/globals';
import type { EventGetter } from './api/logs/EventGetter';
import { DivideAndConquerLogsProvider, type LogsProvider, getLogsProvider } from './providers';
import { isBackendSupportedChain } from './utils/chains';
import type { Filter, Log } from './utils/events';

export class ScriptLogsProvider implements LogsProvider {
  eventGetter: EventGetter;

  constructor(public chainId: number) {
    this.eventGetter = getEventGetter(chainId);
  }

  async getLatestBlock(): Promise<number> {
    const blockNumber = await this.eventGetter.getLatestBlock(this.chainId);
    return blockNumber;
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    const logs = await this.eventGetter.getEvents(this.chainId, filter);
    return logs;
  }
}

export const getScriptLogsProvider = (chainId: number): LogsProvider => {
  if (isBackendSupportedChain(chainId)) {
    return new DivideAndConquerLogsProvider(new ScriptLogsProvider(chainId));
  }

  return getLogsProvider(chainId);
};
