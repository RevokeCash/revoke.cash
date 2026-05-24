import { ExportableError } from '@revoke.cash/core/utils/errors';

export class AutoRevokeError extends ExportableError {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AutoRevokeError';
  }

  export() {
    return { status: this.status, body: { message: this.message } };
  }
}
