export const unpackResult = async (promise: Promise<any>) => (await promise)[0];

export const withFallback = async (promise: Promise<any>, fallback: any) => {
  try {
    return await promise;
  } catch {
    return fallback;
  }
};

export const convertString = async (promise: Promise<any>) => String(await promise);
