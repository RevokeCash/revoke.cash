import kyBase, { HTTPError, type NormalizedOptions } from 'ky';
import PQueue from 'p-queue';
import { SITE_URL } from './constants';
import { ensureAuthSession } from './utils';

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
    beforeRequest: [
      async (request) => {
        if (!isOwnSite(request.url)) return request;

        const path = new URL(request.url).pathname;
        if (!path.startsWith('/api/')) return request;
        if (path.startsWith('/api/auth/')) return request;

        await ensureAuthSession();

        return request;
      },
    ],
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

export const retryOn429 = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) {
      throw e;
    }

    const message = e instanceof Error ? e.message : '';

    if (message.includes('429') || message.includes('rate limited')) {
      console.warn('Rate limit reached, retrying...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return retryOn429(fn, retries - 1);
    }

    if (message.includes('https://rpc.hypurrscan.io') && message.includes('fetch failed')) {
      console.warn('Hypurrscan fetch failed, retrying once...');
      return fn();
    }

    throw e;
  }
};

const isOwnSite = (url: string) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  return new URL(url, siteUrl).origin === new URL(siteUrl).origin;
};

export default ky;
