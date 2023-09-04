export const unpackResult = async <T>(promise: Promise<T[]>): Promise<T> => (await promise)[0];

export const withFallback = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
  try {
    const res = await promise;
    if (res === undefined) return fallback;
    if (typeof res === 'string' && res.trim() === '') return fallback;
    return res;
  } catch {
    return fallback;
  }
};

export const convertString = async (promise: Promise<any>) => String(await promise);

export const filterAsync = async <T>(arr: T[], predicate: (entry: T) => Promise<boolean>) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
};
