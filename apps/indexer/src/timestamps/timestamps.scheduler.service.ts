import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TIMESTAMPS_QUEUE_NAME, type TimestampsJobData } from '@revoke.cash/backend/indexer/queues/timestamps';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { mapAsyncSequential } from '@revoke.cash/core/utils/promises';
import { HOUR } from '@revoke.cash/core/utils/time';
import type { Queue } from 'bullmq';

const TICK_INTERVAL_MS = 1 * HOUR;

@Injectable()
export class TimestampsSchedulerService {
  private readonly logger = new Logger(TimestampsSchedulerService.name);

  constructor(@InjectQueue(TIMESTAMPS_QUEUE_NAME) private readonly queue: Queue<TimestampsJobData>) {}

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    // We enqueue these jobs sequentially to spread the EVALSHA calls across the tick window
    const results = await mapAsyncSequential(ORDERED_CHAINS, async (chainId) => {
      try {
        await this.queue.add('timestamps', { chainId }, { jobId: `timestamps-${chainId}` });
        return true;
      } catch (error) {
        this.logger.warn({ chainId, error: parseErrorMessage(error) }, 'failed to enqueue timestamps job');
        return false;
      }
    });

    const enqueued = results.filter(Boolean).length;
    this.logger.debug({ enqueued, totalChains: ORDERED_CHAINS.length }, 'timestamps tick complete');
  }
}
