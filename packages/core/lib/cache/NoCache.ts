import type { ICache } from './ICache';

// No-op cache for server-side (no caching)
export default class NoCache<T, K> implements ICache<T, K> {
  isInitialized(): boolean {
    return true;
  }

  async initialize(): Promise<void> {
    // No-op
  }

  async get(_key: K): Promise<T | undefined> {
    return undefined;
  }

  async put(_key: K, _data: T): Promise<void> {
    // No-op
  }

  async export(): Promise<T[]> {
    return [];
  }
}
