import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConfigService } from '../config/config.service';
import { QueueService } from '../queue/queue.service';
import { SubscribersService } from '../subscribers/subscribers.service';

/**
 * Manager-only. Every second, picks up to `schedulerBatchSize` ready (address, chain) pairs
 * from `monitor.scan_state` and enqueues a scan job for each. BullMQ's `jobId` dedup means
 * an already-pending scan is not re-enqueued.
 *
 * Sized for ~1M scan_state rows at full Premium scale: 2000 rows/s × 3600 s = 7.2M rows/h,
 * comfortably above the steady-state demand (~345 rows/s assuming most chains are quiet).
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly subscribers: SubscribersService,
    private readonly queues: QueueService,
  ) {}

  @Interval(1000)
  async tick(): Promise<void> {
    if (!this.config.isManager) return;

    const batchSize = this.config.schedulerBatchSize;
    const candidates = await this.subscribers.findReadyToScan(batchSize);
    if (candidates.length === 0) return;

    const outcomes = await Promise.all(
      candidates.map(({ address, chainId }) => this.queues.enqueueScan(chainId, address)),
    );

    const added = outcomes.filter((outcome) => outcome === 'added').length;
    const deduped = outcomes.filter((outcome) => outcome === 'deduped').length;
    this.logger.log({ enqueued: candidates.length, added, deduped }, 'tick enqueued');

    if (candidates.length === batchSize) {
      this.logger.warn({ batchSize }, 'scheduler tick saturated batch — backlog likely');
    }
  }
}
