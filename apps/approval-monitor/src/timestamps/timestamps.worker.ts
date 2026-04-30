import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { type DocumentedChainId, getChainName } from '@revoke.cash/core/chains';
import { resolveTimestamps } from '@revoke.cash/core/monitor/timestamps';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';

export abstract class TimestampsWorker extends WorkerHost {
  protected readonly logger: Logger;

  constructor(public readonly chainId: DocumentedChainId) {
    super();
    this.logger = new Logger(`TimestampsWorker-${getChainName(chainId)}`);
  }

  async process(_job: Job): Promise<void> {
    const result = await resolveTimestamps(this.chainId);
    if (result.blocksProcessed === 0) return;

    if (result.saturated) {
      this.logger.warn(result, 'timestamps batch processed - saturated');
    } else {
      this.logger.log(result, 'timestamps batch processed');
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error): Promise<void> {
    this.logger.error(
      { jobId: job?.id, chainId: this.chainId, error: parseErrorMessage(error) },
      'timestamps batch failed',
    );
  }
}
