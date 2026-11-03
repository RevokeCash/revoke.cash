import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { syncScamSnifferBlocklist } from '@revoke.cash/core/labels/scamsniffer';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';

@Injectable()
export class ScamSnifferSyncService {
  private readonly logger = new Logger(ScamSnifferSyncService.name);

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async sync(): Promise<void> {
    try {
      const { received } = await syncScamSnifferBlocklist();
      this.logger.log({ event: 'scamsniffer_sync_completed', outcome: 'ok', received });
    } catch (error) {
      this.logger.warn({ event: 'scamsniffer_sync_failed', outcome: 'failed', error: parseErrorMessage(error) });
    }
  }
}
