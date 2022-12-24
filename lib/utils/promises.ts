export const unpackResult = async (promise: Promise<any>) => (await promise)[0];

export const withFallback = async (promise: Promise<any>, fallback: any) => {
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
