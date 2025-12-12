import { stringify } from 'viem';

export const isUserRejectionError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isUserRejectionError(parseErrorMessage(error)) || isUserRejectionError(stringifyError(error));
  }

  // This is a user rejection error, but we want to handle it separately to fall back to "queued" batching
  if (isAccountUpgradeRejectionError(error)) return false;

  const lowercaseMessage = error?.toLowerCase();

  if (lowercaseMessage?.includes('user denied')) return true;
  if (lowercaseMessage?.includes('user rejected')) return true;
  if (lowercaseMessage?.includes('transaction was rejected')) return true;
  if (lowercaseMessage?.includes('cancelled by the user')) return true;

  return false;
};

export const isNoFeeRequiredError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isNoFeeRequiredError(parseErrorMessage(error)) || isNoFeeRequiredError(stringifyError(error));
  }

  return error?.toLowerCase()?.includes('no fee required');
};

export const isAccountUpgradeRejectionError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return (
      isAccountUpgradeRejectionError(parseErrorMessage(error)) || isAccountUpgradeRejectionError(stringifyError(error))
    );
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('user rejected account upgrade')) return true;
  return false;
};

export const isBatchSizeError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isBatchSizeError(parseErrorMessage(error)) || isBatchSizeError(stringifyError(error));
  }

  return error?.toLowerCase()?.includes('batch size cannot exceed');
};

export const isLedgerNanoSError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isLedgerNanoSError(parseErrorMessage(error)) || isLedgerNanoSError(stringifyError(error));
  }

  return error?.toLowerCase()?.includes('ethappnftnotsupported');
};

export const isRevertedError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isRevertedError(parseErrorMessage(error)) || isRevertedError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('ethappnftnotsupported')) return false;
  if (lowercaseMessage?.includes('blind signing')) return false;
  if (lowercaseMessage?.includes('revert')) return true;
  return false;
};

export const isOutOfGasError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isOutOfGasError(parseErrorMessage(error)) || isOutOfGasError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('out of gas')) return true;
  return false;
};

export const isLogResponseSizeError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isLogResponseSizeError(parseErrorMessage(error)) || isLogResponseSizeError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('query returned more than 10000 results')) return true; // Infura
  if (lowercaseMessage?.includes('log response size exceeded')) return true; // Alchemy
  if (lowercaseMessage?.includes('query timeout exceeded')) return true; // Also Alchemy
  // This is also a partial match for a network error, but the checks for these two error categories are mutually exclusive
  if (lowercaseMessage?.includes('queued request timed out')) return true;
  if (lowercaseMessage?.includes('query returned more than 1024 results')) return true; // ZERO network
  return false;
};

export const isRateLimitError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isRateLimitError(parseErrorMessage(error)) || isRateLimitError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('max rate limit reached')) return true;
  if (lowercaseMessage?.includes('request failed with status code 429')) return true;
  if (lowercaseMessage?.includes('429 too many requests')) return true;
  return false;
};

export const isNetworkError = (error?: string | any): boolean => {
  if (!error) return false;

  // These error types might sometimes also meet the criteria for a network error, but they are handled separately
  if (isRateLimitError(error)) return false;
  if (isLogResponseSizeError(error)) return false;
  if (isRevertedError(error)) return false;
  if (isOutOfGasError(error)) return false;

  if (typeof error !== 'string') {
    return isNetworkError(parseErrorMessage(error)) || isNetworkError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  if (lowercaseMessage?.includes('request failed')) return true;
  if (lowercaseMessage?.includes('request timed out')) return true;
  if (lowercaseMessage?.includes('request took too long to respond')) return true;
  if (lowercaseMessage?.includes('failed to fetch')) return true;
  if (lowercaseMessage?.includes('service temporarily unavailable')) return true;
  return false;
};

export const isCovalentError = (error?: string | any): boolean => {
  if (!error) return false;

  if (typeof error !== 'string') {
    return isCovalentError(parseErrorMessage(error)) || isCovalentError(stringifyError(error));
  }

  const lowercaseMessage = error?.toLowerCase();
  return lowercaseMessage?.includes('block not found: chain-height');
};

export const parseErrorMessage = (error: any): string => {
  const errorMessage =
    error?.cause?.details || // Abstract Global Wallet
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

export const stringifyError = (error: any, indent?: number): string => {
  try {
    return stringify(error, undefined, indent);
  } catch {
    return String(error);
  }
};
