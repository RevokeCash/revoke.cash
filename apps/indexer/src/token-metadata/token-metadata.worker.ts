import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import {
  TOKEN_METADATA_QUEUE_NAME,
  type TokenMetadataJobData,
} from '@revoke.cash/backend/indexer/queues/token-metadata';
import { GroupLimiterService } from '@revoke.cash/backend/queue/group-limiter.service';
import { enrichToken } from '@revoke.cash/core/indexer/token-metadata';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';
import { MetricsService } from '../metrics/metrics.service';

@Processor(TOKEN_METADATA_QUEUE_NAME, { concurrency: 100, lockDuration: 90_000 })
export class TokenMetadataWorker extends WorkerHost {
  private readonly logger = new Logger(TokenMetadataWorker.name);

  constructor(
    private readonly metrics: MetricsService,
    private readonly groupLimiter: GroupLimiterService,
  ) {
    super();
  }

  async process(job: Job<TokenMetadataJobData>, token?: string): Promise<void> {
    const { chainId, tokenAddress, source } = job.data;

    const result = await this.groupLimiter.runWithLimit(
      chainId,
      async () => {
        const endTimer = this.metrics.tokenMetadataDuration.startTimer({ chain_id: chainId });
        const enrichment = await enrichToken(chainId, tokenAddress);
        endTimer();
        return enrichment;
      },
      { job, token },
    );

    this.metrics.tokenMetadataTotal.inc({ chain_id: chainId, outcome: result.outcome });
    this.logger.debug(
      {
        chainId,
        tokenAddress,
        source,
        outcome: result.outcome,
        durationMs: result.durationMs,
      },
      'token metadata completed',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<TokenMetadataJobData> | undefined, error: Error): Promise<void> {
    const attempt = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 1;
    const exhausted = attempt >= maxAttempts;

    this.logger.error(
      {
        chainId: job?.data?.chainId,
        tokenAddress: job?.data?.tokenAddress,
        source: job?.data?.source,
        attempt,
        maxAttempts,
        exhausted,
        error: { message: parseErrorMessage(error), stack: error.stack },
      },
      'token metadata failed',
    );

    if (!exhausted || !job?.data) return;
    this.metrics.tokenMetadataTotal.inc({ chain_id: job.data.chainId, outcome: 'failed' });
  }
}
