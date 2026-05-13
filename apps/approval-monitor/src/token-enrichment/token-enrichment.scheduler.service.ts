import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { mapAsyncSequential } from '@revoke.cash/core/utils/promises';
import { DAY, MINUTE } from '@revoke.cash/core/utils/time';
import type { Queue } from 'bullmq';
import {
  enqueueUnenrichedTokens,
  TOKEN_ENRICHMENT_QUEUE_NAME,
  type TokenEnrichmentJobData,
} from './token-enrichment.queue';

const TICK_INTERVAL_MS = 5 * MINUTE;
const STALE_AFTER_MS = 1 * DAY;

@Injectable()
export class TokenEnrichmentSchedulerService {
  private readonly logger = new Logger(TokenEnrichmentSchedulerService.name);

  constructor(@InjectQueue(TOKEN_ENRICHMENT_QUEUE_NAME) private readonly queue: Queue<TokenEnrichmentJobData>) {}

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    const staleBefore = new Date(Date.now() - STALE_AFTER_MS);

    const results = await mapAsyncSequential(ORDERED_CHAINS, async (chainId) => {
      try {
        return await enqueueUnenrichedTokens(this.queue, { chainId, staleBefore }, 'scheduler');
      } catch (error) {
        this.logger.warn({ chainId, error: parseErrorMessage(error) }, 'failed to enqueue unenriched tokens');
        return 0;
      }
    });

    const totalEnqueued = results.reduce((sum, count) => sum + count, 0);

    if (totalEnqueued > 0) {
      this.logger.log({ totalEnqueued, totalChains: ORDERED_CHAINS.length }, 'token enrichment tick complete');
    } else {
      this.logger.debug({ totalChains: ORDERED_CHAINS.length }, 'token enrichment tick complete (nothing to enqueue)');
    }
  }
}
