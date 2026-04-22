export interface ICache<T, K = any> {
  get(key: K): Promise<T | undefined>;
  put(key: K, data: T): Promise<void>;
  isInitialized(): boolean;
  initialize(): Promise<void>;
  export(): Promise<T[]>;
}

export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}
