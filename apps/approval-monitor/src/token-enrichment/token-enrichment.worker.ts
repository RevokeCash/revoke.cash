import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { enrichToken } from '@revoke.cash/core/monitor/token-enrichment';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';
import { MetricsService } from '../metrics/metrics.service';
import { GroupLimiterService } from '../queue/group-limiter.service';
import { TOKEN_ENRICHMENT_QUEUE_NAME, type TokenEnrichmentJobData } from './token-enrichment.queue';

@Processor(TOKEN_ENRICHMENT_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000 })
export class TokenEnrichmentWorker extends WorkerHost {
  private readonly logger = new Logger(TokenEnrichmentWorker.name);

  constructor(
    private readonly metrics: MetricsService,
    private readonly groupLimiter: GroupLimiterService,
  ) {
    super();
  }

  async process(job: Job<TokenEnrichmentJobData>, token?: string): Promise<void> {
    const { chainId, tokenAddress, source } = job.data;

    const result = await this.groupLimiter.runWithLimit(
      chainId,
      async () => {
        const endTimer = this.metrics.tokenEnrichmentDuration.startTimer({ chain_id: chainId });
        const enrichment = await enrichToken(chainId, tokenAddress);
        endTimer();
        return enrichment;
      },
      { job, token },
    );

    this.metrics.tokenEnrichmentsTotal.inc({ chain_id: chainId, outcome: result.outcome });
    this.logger.debug(
      {
        chainId,
        tokenAddress,
        source,
        outcome: result.outcome,
        durationMs: result.durationMs,
      },
      'token enrichment completed',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<TokenEnrichmentJobData> | undefined, error: Error): Promise<void> {
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
      'token enrichment failed',
    );

    if (!exhausted || !job?.data) return;
    this.metrics.tokenEnrichmentsTotal.inc({ chain_id: job.data.chainId, outcome: 'failed' });
  }
}
