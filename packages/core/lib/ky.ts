import kyBase, { type BeforeErrorHook, HTTPError } from 'ky';
import PQueue from 'p-queue';

export const kyQueue = new PQueue({ concurrency: 50 });

// Matches search params such as apiKey=... or apikey=... in a URL
const API_KEY_SEARCH_PARAM_PATTERN = /([?&][^=&\s]*key=)[^&\s]+/gi;

// Ky error messages include the request URL, so API keys are redacted before the error is logged, stored or sent to clients
const redactApiKeysInErrorMessage: BeforeErrorHook = ({ error }) => {
  error.message = error.message.replace(API_KEY_SEARCH_PARAM_PATTERN, '$1REDACTED');
  return error;
};

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
    beforeError: [redactApiKeysInErrorMessage],
  },
});

export default ky;
