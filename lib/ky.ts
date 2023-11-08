import kyBase, { HTTPError, NormalizedOptions } from 'ky';

export class KyHttpError extends HTTPError {
  data?: any;

  constructor(response: Response, request: Request, options: NormalizedOptions, data?: any) {
    super(response, request, options);
    this.data = data;
  }
}

const ky = kyBase.extend({
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
