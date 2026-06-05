import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ALLOWANCES_QUEUE_NAME, type AllowancesJobData } from '@revoke.cash/backend/indexer/queues/allowances';
import { GroupLimiterService } from '@revoke.cash/backend/queue/group-limiter.service';
import { recomputeAllowances, recordAllowanceFailure } from '@revoke.cash/core/indexer/allowances';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';
import { MetricsService } from '../metrics/metrics.service';

@Processor(ALLOWANCES_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000 })
export class AllowancesWorker extends WorkerHost {
  private readonly logger = new Logger(AllowancesWorker.name);

  constructor(
    private readonly metrics: MetricsService,
    private readonly groupLimiter: GroupLimiterService,
  ) {
    super();
  }

  async process(job: Job<AllowancesJobData>, token?: string): Promise<void> {
    const { address, chainId, eventsScanId } = job.data;

    const result = await this.groupLimiter.runWithLimit(
      chainId,
      async () => {
        const endTimer = this.metrics.allowanceRecomputeDuration.startTimer({ chain_id: chainId });
        const recompute = await recomputeAllowances(address, chainId);
        endTimer();
        return recompute;
      },
      { job, token },
    );

    if (result.skipped) {
      this.metrics.allowancesTotal.inc({ chain_id: chainId, outcome: 'skipped' });
      this.logger.debug(
        { eventsScanId, chainId, address, durationMs: result.durationMs },
        'no new allowance-relevant events since cursor',
      );
      return;
    }

    this.metrics.allowancesTotal.inc({ chain_id: chainId, outcome: 'ok' });
    this.logger.log(
      {
        eventsScanId,
        chainId,
        address,
        computedCount: result.computedCount,
        affectedTokenCount: result.affectedTokenCount,
        durationMs: result.durationMs,
      },
      'allowance recompute completed',
    );
  }

  // BullMQ retries handle transient errors; only count toward the 'failed' metric once retries
  // are exhausted. Same pattern as EventsWorker.
  @OnWorkerEvent('failed')
  async onFailed(job: Job<AllowancesJobData> | undefined, error: Error): Promise<void> {
    const attempt = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 1;
    const exhausted = attempt >= maxAttempts;

    this.logger.error(
      {
        eventsScanId: job?.data?.eventsScanId,
        chainId: job?.data?.chainId,
        address: job?.data?.address,
        attempt,
        maxAttempts,
        exhausted,
        error: { message: parseErrorMessage(error), stack: error.stack },
      },
      'allowance recompute failed',
    );

    if (!exhausted || !job?.data) return;
    this.metrics.allowancesTotal.inc({ chain_id: job.data.chainId, outcome: 'failed' });
    await recordAllowanceFailure(job.data.address, job.data.chainId, error).catch((err) => {
      this.logger.warn(
        { chainId: job.data.chainId, address: job.data.address, error: parseErrorMessage(err) },
        'failed to record allowance failure state',
      );
    });
  }
}
