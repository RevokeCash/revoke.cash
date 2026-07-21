import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Logger } from 'nestjs-pino';

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

export const registerProcessErrorHandlers = (logger: Logger): void => {
  process.on('unhandledRejection', (reason) => {
    logger.error({
      event: 'unhandled_rejection',
      error: { message: parseErrorMessage(reason), stack: reason instanceof Error ? reason.stack : undefined },
    });
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    logger.error({
      event: 'uncaught_exception',
      error: { message: parseErrorMessage(error), stack: error instanceof Error ? error.stack : undefined },
    });
    process.exit(1);
  });
};
