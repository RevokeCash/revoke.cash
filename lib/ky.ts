import kyBase, { HTTPError, type NormalizedOptions } from 'ky';
import PQueue from 'p-queue';

export class KyHttpError extends HTTPError {
  data?: any;

  constructor(response: Response, request: Request, options: NormalizedOptions, data?: any) {
    super(response, request, options);
    this.data = data;
  }
}

const kyQueue = new PQueue({ concurrency: 50 });

const ky = kyBase.extend({
  timeout: false,
  fetch: (input, options) => kyQueue.add(() => fetch(input, options)),
  hooks: {
    beforeError: [
      async (error) => {
        try {
          const data = await error.response.json();
          return new KyHttpError(error.response, error.request, error.options, data);
        } catch {
          return new KyHttpError(error.response, error.request, error.options);
        }
      },
    ],
  },
});

export const retryOn429 = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if ((e as any).message.includes('429') || (e as any).message.includes('rate limited')) {
      console.error('Rate limit reached, retrying...');
      return retryOn429(fn);
    }

    if ((e as any).message.includes('https://rpc.hypurrscan.io') && (e as any).message.includes('fetch failed')) {
      console.error('Hypurrscan fetch failed, retrying once...');
      return fn();
    }

    throw e;
  }
};

export default ky;
