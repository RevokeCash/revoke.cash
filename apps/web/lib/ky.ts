import kyBase from '@revoke.cash/core/ky';
import { ensureApiSessionForRequest, retryWithFreshApiSession } from './auth/session';
import { parseDtoJson, stringifyDtoJson } from './dto';

const ky = kyBase.extend({
  hooks: {
    beforeRequest: [ensureApiSessionForRequest],
    afterResponse: [retryWithFreshApiSession],
  },
});

export default ky;

export const dtoKy = ky.extend({
  parseJson: parseDtoJson,
  stringifyJson: stringifyDtoJson,
});
