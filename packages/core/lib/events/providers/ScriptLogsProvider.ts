import type { Filter, Log } from '@revoke.cash/core/events';
import { getEventGetter } from '@revoke.cash/core/events/getters';
import type { EventGetter } from '@revoke.cash/core/events/getters/EventGetter';
import type { LogsProvider } from './LogsProvider';

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
