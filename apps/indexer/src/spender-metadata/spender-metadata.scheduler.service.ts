import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  enqueueUnenrichedSpenders,
  SPENDER_METADATA_QUEUE_NAME,
  type SpenderMetadataJobData,
} from '@revoke.cash/backend/indexer/queues/spender-metadata';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { mapAsyncSequential } from '@revoke.cash/core/utils/promises';
import { DAY, HOUR } from '@revoke.cash/core/utils/time';
import type { Queue } from 'bullmq';

const TICK_INTERVAL_MS = 1 * HOUR;
const STALE_AFTER_MS = 1 * DAY;

@Injectable()
export class SpenderMetadataSchedulerService {
  private readonly logger = new Logger(SpenderMetadataSchedulerService.name);

  constructor(@InjectQueue(SPENDER_METADATA_QUEUE_NAME) private readonly queue: Queue<SpenderMetadataJobData>) {}

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    const staleBefore = new Date(Date.now() - STALE_AFTER_MS);

    const results = await mapAsyncSequential(ORDERED_CHAINS, async (chainId) => {
      try {
        return await enqueueUnenrichedSpenders(this.queue, { chainId, staleBefore }, 'scheduler');
      } catch (error) {
        this.logger.warn({ chainId, error: parseErrorMessage(error) }, 'failed to enqueue unenriched spenders');
        return 0;
      }
    });

    const totalEnqueued = results.reduce((sum, count) => sum + count, 0);

    if (totalEnqueued > 0) {
      this.logger.log({ totalEnqueued, totalChains: ORDERED_CHAINS.length }, 'spender metadata tick complete');
    } else {
      this.logger.debug({ totalChains: ORDERED_CHAINS.length }, 'spender metadata tick complete (nothing to enqueue)');
    }
  }
}
