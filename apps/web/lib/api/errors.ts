import { ApiError, ExportableError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { NextResponse } from 'next/server';

export class ValidationError extends ApiError {
  constructor(status: number, message: string, issues?: unknown[]) {
    super(status, message, issues ? { message, issues } : { message });
    this.name = 'ValidationError';
  }
}

interface HandleApiRouteErrorOptions {
  errorMessage?: string;
}

export const handleApiRouteError = (error: unknown, options: HandleApiRouteErrorOptions = {}): NextResponse => {
  if (error instanceof ExportableError) {
    const { status, body } = error.export();
    return NextResponse.json(body, { status });
  }

  // Unexpected error details are logged but never sent to clients; expected errors throw ApiError instead
  const fallbackMessage = options.errorMessage ?? 'API route failed';
  console.error(fallbackMessage, parseErrorMessage(error), error);

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
};
