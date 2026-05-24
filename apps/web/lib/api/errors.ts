import { ExportableError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { NextResponse } from 'next/server';

export class ApiError extends ExportableError {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: Record<string, unknown> = { message },
  ) {
    super(message);
    this.name = 'ApiError';
  }

  export() {
    return { status: this.status, body: this.body };
  }
}

export class ValidationError extends ApiError {
  constructor(status: number, message: string, issues?: unknown[]) {
    super(status, message, issues ? { message, issues } : { message });
    this.name = 'ValidationError';
  }
}

interface HandleApiRouteErrorOptions {
  errorMessage?: string;
  exposeErrorMessage?: boolean;
}

export const handleApiRouteError = (error: unknown, options: HandleApiRouteErrorOptions = {}): NextResponse => {
  if (error instanceof ExportableError) {
    const { status, body } = error.export();
    return NextResponse.json(body, { status });
  }

  const fallbackMessage = options.errorMessage ?? 'API route failed';
  console.error(fallbackMessage, parseErrorMessage(error), error);

  const message =
    options.exposeErrorMessage === false ? fallbackMessage : (parseErrorMessage(error) ?? fallbackMessage);
  return NextResponse.json({ message }, { status: 500 });
};
