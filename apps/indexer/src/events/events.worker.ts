import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import {
  indexEvents,
  recordEventsFailure,
  reduceEventsMaxBlockRangeAfterFailure,
} from '@revoke.cash/core/indexer/events';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job, Queue } from 'bullmq';
import { ALLOWANCES_QUEUE_NAME, type AllowancesJobData } from '../allowances/allowances.queue';
import { MetricsService } from '../metrics/metrics.service';
import { GroupLimiterService } from '../queue/group-limiter.service';
import { TIMESTAMPS_QUEUE_NAME, type TimestampsJobData } from '../timestamps/timestamps.queue';
import {
  enqueueUnenrichedTokens,
  TOKEN_METADATA_QUEUE_NAME,
  type TokenMetadataJobData,
} from '../token-metadata/token-metadata.queue';
import { EVENTS_QUEUE_NAME, type EventsJobData } from './events.queue';

const allowanceJobIdFor = (chainId: number, address: string): string => `${chainId}-${address}`;
const timestampsJobIdFor = (chainId: number): string => `timestamps-${chainId}`;

@Processor(EVENTS_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000 })
export class EventsWorker extends WorkerHost {
  private readonly logger = new Logger(EventsWorker.name);

  constructor(
    private readonly metrics: MetricsService,
    private readonly groupLimiter: GroupLimiterService,
    @InjectQueue(ALLOWANCES_QUEUE_NAME) private readonly allowancesQueue: Queue<AllowancesJobData>,
    @InjectQueue(TIMESTAMPS_QUEUE_NAME) private readonly timestampsQueue: Queue<TimestampsJobData>,
    @InjectQueue(TOKEN_METADATA_QUEUE_NAME)
    private readonly tokenMetadataQueue: Queue<TokenMetadataJobData>,
  ) {
    super();
  }

  async process(job: Job<EventsJobData>, token?: string): Promise<void> {
    const { eventsScanId, address, chainId, reason } = job.data;

    const result = await this.groupLimiter.runWithLimit(
      chainId,
      async () => {
        this.logger.debug({ eventsScanId, chainId, address, reason }, 'processing events');
        const endTimer = this.metrics.eventsScanDuration.startTimer({ chain_id: chainId });
        const eventsResult = await indexEvents(address, chainId);
        if (!eventsResult.nonceZeroSkipped) endTimer({ path: eventsResult.path });
        return eventsResult;
      },
      { job, token },
    );

    if (result.nonceZeroSkipped) {
      this.metrics.eventsScansTotal.inc({ chain_id: chainId, outcome: 'nonce_zero' });
      this.logger.debug({ eventsScanId, chainId, address }, 'events skipped (nonce 0)');
      return;
    }

    this.metrics.eventsScansTotal.inc({ chain_id: chainId, outcome: 'ok' });
    this.metrics.eventsScanLogsFetched.observe({ chain_id: chainId, path: result.path }, result.logsFetched);
    this.logger.log({ eventsScanId, chainId, address, ...result }, 'events indexed');

    if (result.logsWritten > 0) {
      await this.timestampsQueue
        .add('timestamps', { chainId }, { jobId: timestampsJobIdFor(chainId) })
        .catch((error) => {
          this.logger.warn(
            { eventsScanId, chainId, address, error: parseErrorMessage(error) },
            'failed to enqueue timestamps',
          );
        });
    }

    await this.allowancesQueue
      .add('recompute', { address, chainId, eventsScanId }, { jobId: allowanceJobIdFor(chainId, address) })
      .catch((error) => {
        this.logger.warn(
          { eventsScanId, chainId, address, error: parseErrorMessage(error) },
          'failed to enqueue allowance recompute',
        );
      });

    if (result.logsWritten === 0) return;

    const enqueued = await enqueueUnenrichedTokens(
      this.tokenMetadataQueue,
      { chainId, fromBlock: result.fromBlock, toBlock: result.toBlock, limit: null },
      'events',
    ).catch((error) => {
      this.logger.warn(
        { eventsScanId, chainId, error: parseErrorMessage(error) },
        'failed to enqueue token metadata fan-out',
      );
    });

    if (enqueued && enqueued > 0) {
      this.logger.debug(
        { eventsScanId, chainId, fromBlock: result.fromBlock, toBlock: result.toBlock, enqueued },
        'enqueued token metadata jobs',
      );
    }
  }

  // BullMQ fires `failed` after every attempt, including in-process retries. We only want to
  // bump `consecutive_failures` once BullMQ has fully given up — otherwise a single outage
  // walks the counter up by N within one retry cycle and parks the wallet on the 24h cadence.
  @OnWorkerEvent('failed')
  async onFailed(job: Job<EventsJobData> | undefined, error: Error): Promise<void> {
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
      'events indexing failed',
    );

    if (!job?.data) return;

    const { eventsScanId, chainId, address } = job.data;

    try {
      const nextMaxBlockRange = await reduceEventsMaxBlockRangeAfterFailure(address, chainId);
      this.logger.warn(
        { eventsScanId, chainId, address, nextMaxBlockRange },
        'reduced events max block range after failure',
      );
    } catch (rangeError) {
      this.logger.warn(
        { eventsScanId, chainId, address, error: parseErrorMessage(rangeError) },
        'failed to reduce events max block range after failure',
      );
    }

    if (!exhausted) return;
    this.metrics.eventsScansTotal.inc({ chain_id: chainId, outcome: 'failed' });
    await recordEventsFailure(address, chainId, error);
  }
}
