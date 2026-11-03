import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { importTokenLists } from '@revoke.cash/core/labels/token-lists';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';

@Injectable()
export class TokenListsImportService {
  private readonly logger = new Logger(TokenListsImportService.name);

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async runImport(): Promise<void> {
    try {
      const { candidates, skipped, changed, failedFetches } = await importTokenLists();

      failedFetches.forEach(({ chainId, source, error }) => {
        this.logger.warn({ event: 'token_lists_import_fetch_failed', outcome: 'failed', chainId, source, error });
      });

      this.logger.log({
        event: 'token_lists_import_completed',
        outcome: 'ok',
        candidates,
        skipped,
        changed,
        failedFetches: failedFetches.length,
      });
    } catch (error) {
      this.logger.error({ event: 'token_lists_import_failed', outcome: 'failed', error: parseErrorMessage(error) });
    }
  }
}
