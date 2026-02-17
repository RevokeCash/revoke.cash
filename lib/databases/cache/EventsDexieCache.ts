import type { Table } from 'dexie';
import AbstractDexieCache from './AbstractDexieCache';
import type { Events } from './EventsDexie';

export default class EventsDexieCache extends AbstractDexieCache<Events, [number, string]> {
  async initializeDatabaseTable(): Promise<Table<Events>> {
    const { default: EventsDexie } = await import('./EventsDexie');
    return new EventsDexie().events;
  }
}
