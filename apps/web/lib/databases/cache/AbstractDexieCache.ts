import type { Table } from 'dexie';
import { isBrowser } from 'lib/utils';
import { CacheError, type ICache } from './ICache';

export default abstract class AbstractDexieCache<T, K> implements ICache<T, K> {
  table: Table<T> | null = null;
  private initPromise: Promise<void> | null = null;

  isInitialized(): boolean {
    return this.table !== null;
  }

  async initialize(): Promise<void> {
    // Ensure we only initialize once, even with concurrent calls
    if (this.isInitialized()) return;
    if (this.initPromise) return this.initPromise;
    if (!isBrowser()) throw new Error('DexieCache is only available in browser environment');

    // This is where the dynamic import happens
    this.initPromise = this.initializeDatabaseTable().then((table) => {
      this.table = table;
    });

    return this.initPromise;
  }

  abstract initializeDatabaseTable(): Promise<Table<T>>;

  async get(key: K): Promise<T | undefined> {
    await this.initialize();
    if (!this.table) throw new Error('DexieCache not properly initialized');
    try {
      return this.table.get(key);
    } catch {
      throw new CacheError('Could not get data from cache');
    }
  }

  async put(key: K, data: T): Promise<void> {
    await this.initialize();
    if (!this.table) throw new Error('DexieCache not properly initialized');
    try {
      await this.table.put(data, key);
    } catch {
      throw new CacheError('Could not put data into cache');
    }
  }

  async export(): Promise<T[]> {
    await this.initialize();
    if (!this.table) throw new Error('DexieCache not properly initialized');
    try {
      return this.table.toArray();
    } catch {
      throw new CacheError('Could not export data from cache');
    }
  }
}
