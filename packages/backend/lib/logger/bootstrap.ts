const getErrorDetails = (error: unknown): string => {
  if (error instanceof Error) return error.stack ?? error.message;
  return String(error);
};

const getErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;

  const code = error.code;
  return typeof code === 'string' ? code : undefined;
};

export const logBootstrapError = (serviceName: string, error: unknown): void => {
  const code = getErrorCode(error);
  const suffix = code ? ` (${code})` : '';

  console.error(`[Bootstrap] Failed to bootstrap ${serviceName}${suffix}\n${getErrorDetails(error)}`);
};
