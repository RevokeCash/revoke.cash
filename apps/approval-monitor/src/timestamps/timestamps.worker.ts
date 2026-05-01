import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { DocumentedChainId } from '@revoke.cash/core/chains';
import { resolveTimestamps } from '@revoke.cash/core/monitor/timestamps';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';
import { TIMESTAMPS_QUEUE_NAME, type TimestampsJobData } from './timestamps.queue';

@Processor(TIMESTAMPS_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000 })
export class TimestampsWorker extends WorkerHost {
  private readonly logger = new Logger(TimestampsWorker.name);

  async process(job: Job<TimestampsJobData>): Promise<void> {
    const { chainId } = job.data;
    const result = await resolveTimestamps(chainId as DocumentedChainId);
    if (result.blocksProcessed === 0) return;

    if (result.saturated) {
      this.logger.warn(result, 'timestamps batch processed - saturated');
    } else {
      this.logger.log(result, 'timestamps batch processed');
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<TimestampsJobData> | undefined, error: Error): Promise<void> {
    this.logger.error(
      { jobId: job?.id, chainId: job?.data?.chainId, error: parseErrorMessage(error) },
      'timestamps batch failed',
    );
  }
}
