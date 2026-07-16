import type { Filter, Log } from '@revoke.cash/core/events';
import { getEventGetter } from '@revoke.cash/core/events/getters';
import type { EventGetter } from '@revoke.cash/core/events/getters/EventGetter';
import { withTimeout } from '@revoke.cash/core/utils/promises';
import { SECOND } from '@revoke.cash/core/utils/time';
import type { LogsProvider } from './LogsProvider';

export class ScriptLogsProvider implements LogsProvider {
  eventGetter: EventGetter;

  constructor(public chainId: number) {
    this.eventGetter = getEventGetter(chainId);
  }

  async getLatestBlock(): Promise<number> {
    return withTimeout(this.eventGetter.getLatestBlock(this.chainId), 30 * SECOND, 'Latest block request timed out');
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    return withTimeout(this.eventGetter.getEvents(this.chainId, filter), 30 * SECOND, 'Event getter timed out');
  }
}
