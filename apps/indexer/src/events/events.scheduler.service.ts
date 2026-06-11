import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  type EnqueueOutcome,
  EVENTS_QUEUE_NAME,
  type EventsJobData,
  scheduledEventsJobId,
} from '@revoke.cash/backend/indexer/queues/events';
import { MINUTE } from '@revoke.cash/core/utils/time';
import type { Queue } from 'bullmq';
import type { Address } from 'viem';
import { ConfigService } from '../config/config.service';
import { SubscribersService } from '../subscribers/subscribers.service';

const TICK_INTERVAL_MS = 1 * MINUTE;

@Injectable()
export class EventsSchedulerService {
  private readonly logger = new Logger(EventsSchedulerService.name);

  constructor(
    @InjectQueue(EVENTS_QUEUE_NAME) private readonly queue: Queue<EventsJobData>,
    private readonly config: ConfigService,
    private readonly subscribers: SubscribersService,
  ) {}

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    if (!this.config.isManager) return;

    const batchSize = this.config.schedulerBatchSize;
    const candidates = await this.subscribers.findReadyToIndex(batchSize);

    if (candidates.length === 0) {
      this.logger.debug({ event: 'events_scheduler_tick_completed', outcome: 'empty', lagSeconds: 0 });
      return;
    }

    const lagSeconds = Math.max(0, (Date.now() - candidates[0].nextRunAt.getTime()) / 1000);

    const outcomes = await Promise.all(candidates.map(({ address, chainId }) => this.enqueueEvents(chainId, address)));

    const added = outcomes.filter((outcome) => outcome === 'added').length;
    const deduped = outcomes.filter((outcome) => outcome === 'deduped').length;

    this.logger.log({
      event: 'events_scheduler_tick_completed',
      outcome: 'enqueued',
      enqueued: candidates.length,
      added,
      deduped,
      lagSeconds,
    });

    if (candidates.length === batchSize) {
      this.logger.warn({ event: 'events_scheduler_tick_saturated', outcome: 'saturated', batchSize, lagSeconds });
    }
  }

  private async enqueueEvents(chainId: number, address: Address): Promise<EnqueueOutcome> {
    const jobId = scheduledEventsJobId(chainId, address);
    if (await this.jobExists(jobId)) return 'deduped';

    const eventsScanId = randomUUID();
    await this.queue.add(
      'events',
      { eventsScanId, address, chainId, reason: 'scheduled', scheduledAt: Date.now() },
      { jobId },
    );
    return 'added';
  }

  async jobExists(jobId: string): Promise<boolean> {
    const client = await this.queue.client;
    return Boolean(await client.exists(this.queue.toKey(jobId)));
  }
}
