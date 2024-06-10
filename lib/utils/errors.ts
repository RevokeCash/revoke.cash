import { stringify } from 'viem';

export const isUserRejectionError = (message?: string): boolean => {
  const lowercaseMessage = message?.toLowerCase();
  if (lowercaseMessage?.includes('user denied')) return true;
  if (lowercaseMessage?.includes('user rejected')) return true;
  if (lowercaseMessage?.includes('transaction was rejected')) return true;
  return false;
};

export const isRevertedError = (message?: string): boolean => {
  const lowercaseMessage = message?.toLowerCase();
  if (lowercaseMessage?.includes('revert')) return true;
  return false;
};

export const isLogResponseSizeError = (error?: string | any) => {
  if (typeof error !== 'string') {
    return isLogResponseSizeError(parseErrorMessage(error)) || isLogResponseSizeError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('query returned more than 10000 results')) return true;
  if (lowercaseMessage?.includes('log response size exceeded')) return true;
  if (lowercaseMessage?.includes('query timeout exceeded')) return true;
  // This is also a partial match for a network error, but the checks for these two error categories are mutually exclusive
  if (lowercaseMessage?.includes('queued request timed out')) return true;
  return false;
};

export const isRateLimitError = (error?: string | any) => {
  if (typeof error !== 'string') {
    return isRateLimitError(parseErrorMessage(error)) || isRateLimitError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('max rate limit reached')) return true;
  if (lowercaseMessage?.includes('request failed with status code 429')) return true;
  if (lowercaseMessage?.includes('429 too many requests')) return true;
  return false;
};

export const isNetworkError = (error?: string | any) => {
  if (typeof error !== 'string') {
    return isNetworkError(parseErrorMessage(error)) || isNetworkError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('request failed')) return true;
  if (lowercaseMessage?.includes('request timed out')) return true;
  if (lowercaseMessage?.includes('request took too long to respond')) return true;
  if (lowercaseMessage?.includes('failed to fetch')) return true;
  return false;
};

export const parseErrorMessage = (error: any): string => {
  const errorMessage =
    error?.error?.message ||
    error?.data?.message ||
    error?.response?.data?.message ||
    error?.shortMessage ||
    error?.message ||
    error;

  if (typeof errorMessage === 'object') {
    return stringifyError(errorMessage);
  }

  return String(errorMessage);
};

export const stringifyError = (error: any): string => {
  try {
    return stringify(error);
  } catch {
    return String(error);
  }
};
