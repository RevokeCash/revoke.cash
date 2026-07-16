import { ExportableError } from '@revoke.cash/core/utils/errors';

export class EventDataSourceError extends ExportableError {
  constructor(
    public readonly chainId: number,
    message: string,
    public readonly reason?: string,
  ) {
    super(message);
    this.name = 'EventDataSourceError';
  }

  export() {
    return {
      status: 503,
      body: {
        message: this.message,
        details: { chainId: this.chainId, reason: this.reason },
      },
    };
  }
}

export class LatestBlockUnavailableError extends EventDataSourceError {
  constructor(chainId: number, reason?: string) {
    super(chainId, 'Failed to get latest block number', reason);
    this.name = 'LatestBlockUnavailableError';
  }
}

export class EventLogsUnavailableError extends EventDataSourceError {
  constructor(chainId: number, reason?: string) {
    super(chainId, 'Could not retrieve event logs from the blockchain', reason);
    this.name = 'EventLogsUnavailableError';
  }
}

export class EventDataSourceOutOfSyncError extends EventDataSourceError {
  constructor(chainId: number) {
    super(chainId, 'Events data source is out of sync with the blockchain, please try again later.');
    this.name = 'EventDataSourceOutOfSyncError';
  }
}
