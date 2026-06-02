import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { MINUTE } from '@revoke.cash/core/utils/time';
import type { Queue } from 'bullmq';
import type { Address } from 'viem';
import { ConfigService } from '../config/config.service';
import { MetricsService } from '../metrics/metrics.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { type EnqueueOutcome, EVENTS_QUEUE_NAME, type EventsJobData } from './events.queue';

const TICK_INTERVAL_MS = 1 * MINUTE;

const jobIdFor = (chainId: number, address: Address): string => `${chainId}-${address}`;

@Injectable()
export class EventsSchedulerService {
  private readonly logger = new Logger(EventsSchedulerService.name);

  constructor(
    @InjectQueue(EVENTS_QUEUE_NAME) private readonly queue: Queue<EventsJobData>,
    private readonly config: ConfigService,
    private readonly subscribers: SubscribersService,
    private readonly metrics: MetricsService,
  ) {}

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    if (!this.config.isManager) return;

    const batchSize = this.config.schedulerBatchSize;
    const candidates = await this.subscribers.findReadyToIndex(batchSize);

    if (candidates.length === 0) return void this.metrics.schedulerLag.set(0);

    const lagSeconds = Math.max(0, (Date.now() - candidates[0].nextRunAt.getTime()) / 1000);
    this.metrics.schedulerLag.set(lagSeconds);

    const outcomes = await Promise.all(candidates.map(({ address, chainId }) => this.enqueueEvents(chainId, address)));

    const added = outcomes.filter((outcome) => outcome === 'added').length;
    const deduped = outcomes.filter((outcome) => outcome === 'deduped').length;

    this.metrics.schedulerTickOutcomes.inc({ outcome: 'added' }, added);
    this.metrics.schedulerTickOutcomes.inc({ outcome: 'deduped' }, deduped);

    this.logger.log({ enqueued: candidates.length, added, deduped, lagSeconds }, 'tick enqueued');

    if (candidates.length === batchSize) {
      this.logger.warn({ batchSize }, 'scheduler tick saturated batch — backlog likely');
    }
  }

  private async enqueueEvents(chainId: number, address: Address): Promise<EnqueueOutcome> {
    const jobId = jobIdFor(chainId, address);
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
