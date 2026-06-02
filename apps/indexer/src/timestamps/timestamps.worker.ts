import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { resolveAndPersistTimestamps } from '@revoke.cash/core/indexer/timestamps';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { DelayedError, type Job } from 'bullmq';
import { TIMESTAMPS_QUEUE_NAME, type TimestampsJobData } from './timestamps.queue';

const CONTINUATION_DELAY_MS = 500;

@Processor(TIMESTAMPS_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000 })
export class TimestampsWorker extends WorkerHost {
  private readonly logger = new Logger(TimestampsWorker.name);

  async process(job: Job<TimestampsJobData>, token?: string): Promise<void> {
    const { chainId } = job.data;
    const result = await resolveAndPersistTimestamps(chainId);
    if (result.blocksProcessed === 0) return;

    if (result.saturated) {
      this.logger.warn(result, 'timestamps batch processed - saturated, requeueing continuation');
      await job.moveToDelayed(Date.now() + CONTINUATION_DELAY_MS, token);
      throw new DelayedError();
    }

    this.logger.log(result, 'timestamps batch processed');
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<TimestampsJobData> | undefined, error: Error): Promise<void> {
    this.logger.error(
      { jobId: job?.id, chainId: job?.data?.chainId, error: parseErrorMessage(error) },
      'timestamps batch failed',
    );
  }
}
