import { randomUUID } from 'node:crypto';
import { getQueueToken } from '@nestjs/bullmq';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Interval } from '@nestjs/schedule';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Queue } from 'bullmq';
import type { Address } from 'viem';
import { ConfigService } from '../config/config.service';
import { MetricsService } from '../metrics/metrics.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { type EnqueueOutcome, type ScanJobData, scanQueueNameForChain } from './scan.queue';

const jobIdFor = (chainId: number, address: Address): string => `${chainId}-${address}`;

@Injectable()
export class ScanSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ScanSchedulerService.name);
  private readonly queues = new Map<number, Queue<ScanJobData>>();

  constructor(
    private readonly config: ConfigService,
    private readonly subscribers: SubscribersService,
    private readonly metrics: MetricsService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit(): void {
    for (const chainId of ORDERED_CHAINS) {
      const token = getQueueToken(scanQueueNameForChain(chainId));
      const queue = this.moduleRef.get<Queue<ScanJobData>>(token, { strict: false });
      this.queues.set(chainId, queue);
    }
    this.logger.log({ chainCount: this.queues.size }, 'resolved per-chain scan queues');
  }

  @Interval(1000)
  async tick(): Promise<void> {
    if (!this.config.isManager) return;

    const batchSize = this.config.schedulerBatchSize;
    const candidates = await this.subscribers.findReadyToScan(batchSize);

    if (candidates.length === 0) return void this.metrics.schedulerLag.set(0);

    const lagSeconds = Math.max(0, (Date.now() - candidates[0].nextRunAt.getTime()) / 1000);
    this.metrics.schedulerLag.set(lagSeconds);

    const outcomes = await Promise.all(candidates.map(({ address, chainId }) => this.enqueueScan(chainId, address)));

    const added = outcomes.filter((outcome) => outcome === 'added').length;
    const deduped = outcomes.filter((outcome) => outcome === 'deduped').length;
    const noQueue = outcomes.filter((outcome) => outcome === 'no_queue').length;

    this.metrics.schedulerTickOutcomes.inc({ outcome: 'added' }, added);
    this.metrics.schedulerTickOutcomes.inc({ outcome: 'deduped' }, deduped);
    this.metrics.schedulerTickOutcomes.inc({ outcome: 'no_queue' }, noQueue);

    this.logger.log({ enqueued: candidates.length, added, deduped, noQueue, lagSeconds }, 'tick enqueued');

    if (candidates.length === batchSize) {
      this.logger.warn({ batchSize }, 'scheduler tick saturated batch — backlog likely');
    }
  }

  private async enqueueScan(chainId: number, address: Address): Promise<EnqueueOutcome> {
    const queue = this.queues.get(chainId);
    if (!queue) {
      this.logger.warn({ chainId, address }, 'no queue registered for chain; skipping enqueue');
      return 'no_queue';
    }

    const jobId = jobIdFor(chainId, address);
    const existing = await queue.getJob(jobId);
    if (existing) return 'deduped';

    const scanId = randomUUID();
    await queue.add('scan', { scanId, address, chainId, reason: 'scheduled', scheduledAt: Date.now() }, { jobId });
    return 'added';
  }
}
