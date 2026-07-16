import kyBase, { HTTPError } from 'ky';
import PQueue from 'p-queue';

export const kyQueue = new PQueue({ concurrency: 50 });

// POST requests are only retried if they are 429 (rate limited)
const ky = kyBase.extend({
  timeout: false,
  fetch: (input, options) => kyQueue.add(() => fetch(input, options)),
  retry: {
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace', 'post'],
  },
  hooks: {
    beforeRetry: [
      ({ request, error }) => {
        const isRateLimited = error instanceof HTTPError && error.response.status === 429;
        if (request.method === 'POST' && !isRateLimited) throw error;
      },
    ],
  },
});

export default ky;
