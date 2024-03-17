import kyBase, { HTTPError, NormalizedOptions } from 'ky';
import PQueue from 'p-queue';

export class KyHttpError extends HTTPError {
  data?: any;

  constructor(response: Response, request: Request, options: NormalizedOptions, data?: any) {
    super(response, request, options);
    this.data = data;
  }
}

const kyQueue = new PQueue({ concurrency: 100 });

const ky = kyBase.extend({
  timeout: false,
  fetch: (input, options) => kyQueue.add(() => fetch(input, options), { throwOnTimeout: true }),
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

export default ky;
