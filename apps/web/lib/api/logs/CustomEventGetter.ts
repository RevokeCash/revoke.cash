import type { Filter, Log } from 'lib/utils/events';
import type { EventGetter } from './EventGetter';

export class CustomEventGetter implements EventGetter {
  constructor(private eventGetters: Record<number, EventGetter>) {}

  async getLatestBlock(chainId: number): Promise<number> {
    const eventGetter = this.eventGetters[chainId];
    if (!eventGetter) throw new Error(`No custom event getter configured for chainId ${chainId}`);
    return eventGetter.getLatestBlock(chainId);
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const eventGetter = this.eventGetters[chainId];
    if (!eventGetter) throw new Error(`No custom event getter configured for chainId ${chainId}`);
    return eventGetter.getEvents(chainId, filter);
  }
}
