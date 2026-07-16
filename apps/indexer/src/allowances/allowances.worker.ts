import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ALLOWANCES_QUEUE_NAME, type AllowancesJobData } from '@revoke.cash/backend/indexer/queues/allowances';
import { GroupLimiterService } from '@revoke.cash/backend/queue/group-limiter.service';
import { recomputeAllowances, recordAllowanceFailure } from '@revoke.cash/core/indexer/allowances';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';

@Processor(ALLOWANCES_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000 })
export class AllowancesWorker extends WorkerHost {
  private readonly logger = new Logger(AllowancesWorker.name);

  constructor(private readonly groupLimiter: GroupLimiterService) {
    super();
  }

  async process(job: Job<AllowancesJobData>, token?: string): Promise<void> {
    const { address, chainId, eventsScanId } = job.data;

    const result = await this.groupLimiter.runWithLimit(chainId, () => recomputeAllowances(address, chainId), {
      job,
      token,
    });

    if (result.skipped) {
      this.logger.debug({
        event: 'allowance_recompute_completed',
        outcome: 'skipped',
        eventsScanId,
        chainId,
        address,
        durationMs: result.durationMs,
      });
      return;
    }

    this.logger.log({
      event: 'allowance_recompute_completed',
      outcome: 'ok',
      eventsScanId,
      chainId,
      address,
      computedCount: result.computedCount,
      affectedTokenCount: result.affectedTokenCount,
      durationMs: result.durationMs,
    });
  }

  // BullMQ retries handle transient errors; only record failure state once retries are exhausted.
  @OnWorkerEvent('failed')
  async onFailed(job: Job<AllowancesJobData> | undefined, error: Error): Promise<void> {
    const attempt = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 1;
    const exhausted = attempt >= maxAttempts;

    this.logger.error({
      event: 'allowance_recompute_failed',
      outcome: exhausted ? 'failed' : 'retrying',
      eventsScanId: job?.data?.eventsScanId,
      chainId: job?.data?.chainId,
      address: job?.data?.address,
      attempt,
      maxAttempts,
      exhausted,
      error: { message: parseErrorMessage(error), stack: error.stack },
    });

    if (!exhausted || !job?.data) return;
    await recordAllowanceFailure(job.data.address, job.data.chainId, error).catch((err) => {
      this.logger.warn({
        event: 'allowance_failure_state_update_failed',
        outcome: 'failed',
        chainId: job.data.chainId,
        address: job.data.address,
        error: parseErrorMessage(err),
      });
    });
  }
}
