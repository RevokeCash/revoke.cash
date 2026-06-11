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

@Processor(TOKEN_METADATA_QUEUE_NAME, { concurrency: 100, lockDuration: 90_000 })
export class TokenMetadataWorker extends WorkerHost {
  private readonly logger = new Logger(TokenMetadataWorker.name);

  constructor(private readonly groupLimiter: GroupLimiterService) {
    super();
  }

  async process(job: Job<TokenMetadataJobData>, token?: string): Promise<void> {
    const { chainId, tokenAddress, source } = job.data;

    const result = await this.groupLimiter.runWithLimit(chainId, () => enrichToken(chainId, tokenAddress), {
      job,
      token,
    });

    this.logger.debug({
      event: 'token_metadata_completed',
      chainId,
      tokenAddress,
      source,
      outcome: result.outcome,
      durationMs: result.durationMs,
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<TokenMetadataJobData> | undefined, error: Error): Promise<void> {
    const attempt = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 1;
    const exhausted = attempt >= maxAttempts;

    this.logger.error({
      event: 'token_metadata_failed',
      outcome: exhausted ? 'failed' : 'retrying',
      chainId: job?.data?.chainId,
      tokenAddress: job?.data?.tokenAddress,
      source: job?.data?.source,
      attempt,
      maxAttempts,
      exhausted,
      error: { message: parseErrorMessage(error), stack: error.stack },
    });
  }
}
