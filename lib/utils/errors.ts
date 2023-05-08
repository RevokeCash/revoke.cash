export const isUserRejectionError = (error: any): boolean => {
  const message = error.error?.reason ?? error.reason ?? error.error?.message ?? error.message;
  const lowercaseMessage = message?.toLowerCase();
  if (lowercaseMessage?.includes('user denied')) return true;
  if (lowercaseMessage?.includes('user rejected')) return true;
  return false;
};

export const isRevertedError = (error: any): boolean => {
  const message = error.error?.reason ?? error.reason ?? error.error?.message ?? error.message;
  const lowercaseMessage = message?.toLowerCase();
  if (lowercaseMessage?.includes('revert')) return true;
  return false;
};

export const isLogResponseSizeError = (error: any) => {
  const errorMessage = error?.error?.message ?? error?.data?.message ?? error?.message;
  if (errorMessage?.includes('query returned more than 10000 results')) return true;
  if (errorMessage?.includes('Log response size exceeded')) return true;
  if (errorMessage?.includes('Query timeout exceeded')) return true;
  return false;
};

export const isRateLimitError = (error: any) => {
  const errorMessage = error?.error?.message ?? error?.data?.message ?? error?.message;
  if (errorMessage?.includes('Max rate limit reached')) return true;
  if (errorMessage?.includes('Request failed with status code 429')) return true;
  if (errorMessage?.includes('429 Too Many Requests')) return true;
  return false;
};
