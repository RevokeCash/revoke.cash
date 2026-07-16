import { type Address, getAddress, isAddress } from 'viem';

export type SearchParamValue = string | string[] | undefined;

// Supports both the single form (?status=queued) and comma lists (?status=queued,failed)
export const parseListParam = (param: SearchParamValue): string[] => {
  if (typeof param !== 'string') return [];
  return param
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export const parseAllowedListParam = <TValue extends string>(
  param: SearchParamValue,
  allowedValues: readonly TValue[],
): TValue[] => {
  return parseListParam(param).filter((entry): entry is TValue => (allowedValues as readonly string[]).includes(entry));
};

export const parseAddressParam = (param: SearchParamValue): Address | undefined => {
  if (typeof param !== 'string' || !isAddress(param, { strict: false })) return undefined;
  return getAddress(param);
};
