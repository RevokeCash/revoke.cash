import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import {
  SPENDER_METADATA_QUEUE_NAME,
  type SpenderMetadataJobData,
} from '@revoke.cash/backend/indexer/queues/spender-metadata';
import { GroupLimiterService } from '@revoke.cash/backend/queue/group-limiter.service';
import { enrichSpender } from '@revoke.cash/core/indexer/spender-metadata';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';
import { MetricsService } from '../metrics/metrics.service';

@Processor(SPENDER_METADATA_QUEUE_NAME, { concurrency: 100, lockDuration: 90_000 })
export class SpenderMetadataWorker extends WorkerHost {
  private readonly logger = new Logger(SpenderMetadataWorker.name);

  constructor(
    private readonly metrics: MetricsService,
    private readonly groupLimiter: GroupLimiterService,
  ) {
    super();
  }

  async process(job: Job<SpenderMetadataJobData>, token?: string): Promise<void> {
    const { chainId, spenderAddress, source } = job.data;

    const result = await this.groupLimiter.runWithLimit(
      chainId,
      async () => {
        const endTimer = this.metrics.spenderMetadataDuration.startTimer({ chain_id: chainId });
        const enrichment = await enrichSpender(chainId, spenderAddress);
        endTimer();
        return enrichment;
      },
      { job, token },
    );

    this.metrics.spenderMetadataTotal.inc({ chain_id: chainId, outcome: result.outcome });
    this.logger.debug(
      {
        chainId,
        spenderAddress,
        source,
        outcome: result.outcome,
        durationMs: result.durationMs,
      },
      'spender metadata completed',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<SpenderMetadataJobData> | undefined, error: Error): Promise<void> {
    const attempt = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 1;
    const exhausted = attempt >= maxAttempts;

    this.logger.error(
      {
        chainId: job?.data?.chainId,
        spenderAddress: job?.data?.spenderAddress,
        source: job?.data?.source,
        attempt,
        maxAttempts,
        exhausted,
        error: { message: parseErrorMessage(error), stack: error.stack },
      },
      'spender metadata failed',
    );

    if (!exhausted || !job?.data) return;
    this.metrics.spenderMetadataTotal.inc({ chain_id: job.data.chainId, outcome: 'failed' });
  }
}
