const TYPE_KEY = '__revokeCashJsonType';
const BIGINT_TYPE = 'bigint';

interface EncodedBigInt {
  [TYPE_KEY]: typeof BIGINT_TYPE;
  value: string;
}

export const stringifyDtoJson = (value: unknown): string => {
  return JSON.stringify(value, (_key, nestedValue) => {
    if (typeof nestedValue === 'bigint') {
      return { [TYPE_KEY]: BIGINT_TYPE, value: nestedValue.toString() } satisfies EncodedBigInt;
    }

    return nestedValue;
  });
};

export const parseDtoJson = <T = unknown>(text: string): T => {
  return JSON.parse(text, (_key, nestedValue) => {
    if (isEncodedBigInt(nestedValue)) return BigInt(nestedValue.value);
    return nestedValue;
  }) as T;
};

export const dtoJsonResponse = <T>(body: T, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers);
  headers.set('content-type', 'application/json');

  return new Response(stringifyDtoJson(body), { ...init, headers });
};

const isEncodedBigInt = (value: unknown): value is EncodedBigInt => {
  if (typeof value !== 'object' || value === null) return false;

  const entries = Object.entries(value);
  if (entries.length !== 2) return false;

  const maybeEncoded: Partial<EncodedBigInt> = value;
  return (
    maybeEncoded[TYPE_KEY] === BIGINT_TYPE &&
    typeof maybeEncoded.value === 'string' &&
    /^-?\d+$/.test(maybeEncoded.value)
  );
};
