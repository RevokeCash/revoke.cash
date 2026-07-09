import kyBase from 'ky';
import PQueue from 'p-queue';
import { isRateLimitError } from './utils/errors';

const kyQueue = new PQueue({ concurrency: 50 });

const ky = kyBase.extend({
  timeout: false,
  fetch: (input, options) => kyQueue.add(() => fetch(input, options)),
});

export const retryOn429 = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;

    if (isRateLimitError(e)) {
      console.warn('Rate limit reached, retrying...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return retryOn429(fn, retries - 1);
    }

    throw e;
  }
};

export default ky;
