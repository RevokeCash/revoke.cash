import type { Address } from 'viem';

export const assertFulfilled = <T>(item: PromiseSettledResult<T>): item is PromiseFulfilledResult<T> => {
  return item.status === 'fulfilled';
};

export const toLowercaseAddress = (address: Address): Address => address.toLowerCase() as Address;

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

// This is O(n) complexity because Set.has() and Set.add() are O(1), which is much faster than the previous
// iterations of this function, which were O(n^2) and later O(n*m). This doesn't matter for most cases, but for
// our calculate-potential-losses script, it makes a huge difference because we might be dealing with deduplicating
// 1m+ logs.
export const deduplicateArray = <T>(
  array: readonly T[],
  keyGenerator: (item: T) => string = (item) => `${item}`,
): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of array) {
    const key = keyGenerator(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
};

export const normaliseLabel = (label: string) => {
  return label.toLowerCase().replace(/[ -]/g, '_');
};

export const range = (length: number) => Array.from({ length }, (_, i) => i);

export const isBrowser = (): boolean => typeof globalThis === 'object' && 'window' in globalThis;

export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }

  return result;
};

export const slugify = (text: string) => {
  return text.toLowerCase().replace(/ /g, '_');
};

export const singleton = <T>(factory: () => T): (() => T) => {
  let instance: T | undefined;

  return () => {
    if (!instance) instance = factory();
    return instance;
  };
};
