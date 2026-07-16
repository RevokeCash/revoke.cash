import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  EVENTS_QUEUE_NAME,
  type EventsJobData,
  scheduledEventsJobId,
} from '@revoke.cash/backend/indexer/queues/events';
import { getDb } from '@revoke.cash/core/db/client';
import { disableIndexingForRemovedChains } from '@revoke.cash/core/indexer/register';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { MINUTE } from '@revoke.cash/core/utils/time';
import type { Queue } from 'bullmq';
import type { Address } from 'viem';
import { ConfigService } from '../config/config.service';
import { SubscribersService } from '../subscribers/subscribers.service';

const TICK_INTERVAL_MS = 1 * MINUTE;

@Injectable()
export class EventsSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventsSchedulerService.name);

  constructor(
    @InjectQueue(EVENTS_QUEUE_NAME) private readonly queue: Queue<EventsJobData>,
    private readonly config: ConfigService,
    private readonly subscribers: SubscribersService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.isManager) return;

    try {
      const disabledCount = await disableIndexingForRemovedChains(getDb());
      if (disabledCount > 0) {
        this.logger.log({ event: 'events_state_removed_chains_disabled', outcome: 'disabled', disabledCount });
      }
    } catch (error) {
      this.logger.warn({
        event: 'events_state_removed_chains_sweep_failed',
        outcome: 'failed',
        error: parseErrorMessage(error),
      });
    }
  }

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    if (!this.config.isManager) return;

    const batchSize = 2000;
    const candidates = await this.subscribers.findReadyToIndex(batchSize);

    if (candidates.length === 0) {
      this.logger.debug({ event: 'events_scheduler_tick_completed', outcome: 'empty', lagSeconds: 0 });
      return;
    }

    const lagSeconds = Math.max(0, (Date.now() - candidates[0].nextRunAt.getTime()) / 1000);

    await Promise.all(candidates.map(({ address, chainId }) => this.enqueueEvents(chainId, address)));

    this.logger.log({
      event: 'events_scheduler_tick_completed',
      outcome: 'enqueued',
      enqueued: candidates.length,
      lagSeconds,
    });

    if (candidates.length === batchSize) {
      this.logger.warn({ event: 'events_scheduler_tick_saturated', outcome: 'saturated', batchSize, lagSeconds });
    }
  }

  // Adding a job whose jobId is already queued is a no-op in BullMQ, so pairs that are still
  // pending from a previous tick are deduplicated without a separate existence check
  private async enqueueEvents(chainId: number, address: Address): Promise<void> {
    const eventsScanId = randomUUID();
    await this.queue.add(
      'events',
      { eventsScanId, address, chainId, reason: 'scheduled', scheduledAt: Date.now() },
      { jobId: scheduledEventsJobId(chainId, address) },
    );
  }
}
