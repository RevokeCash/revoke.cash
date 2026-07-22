import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import {
  ALLOWANCES_QUEUE_NAME,
  type AllowancesJobData,
  allowanceRecomputeJobId,
} from '@revoke.cash/backend/indexer/queues/allowances';
import { EVENTS_QUEUE_NAME, type EventsJobData } from '@revoke.cash/backend/indexer/queues/events';
import {
  enqueueUnenrichedSpenders,
  SPENDER_METADATA_QUEUE_NAME,
  type SpenderMetadataJobData,
} from '@revoke.cash/backend/indexer/queues/spender-metadata';
import {
  TIMESTAMPS_QUEUE_NAME,
  type TimestampsJobData,
  timestampsJobId,
} from '@revoke.cash/backend/indexer/queues/timestamps';
import {
  enqueueUnenrichedTokens,
  TOKEN_METADATA_QUEUE_NAME,
  type TokenMetadataJobData,
} from '@revoke.cash/backend/indexer/queues/token-metadata';
import { GroupLimiterService } from '@revoke.cash/backend/queue/group-limiter.service';
import {
  indexEvents,
  isSplittableScanError,
  recordEventsFailure,
  reduceEventsMaxBlockRangeAfterFailure,
} from '@revoke.cash/core/indexer/events';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job, Queue } from 'bullmq';

@Processor(EVENTS_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000 })
export class EventsWorker extends WorkerHost {
  private readonly logger = new Logger(EventsWorker.name);

  constructor(
    private readonly groupLimiter: GroupLimiterService,
    @InjectQueue(ALLOWANCES_QUEUE_NAME) private readonly allowancesQueue: Queue<AllowancesJobData>,
    @InjectQueue(TIMESTAMPS_QUEUE_NAME) private readonly timestampsQueue: Queue<TimestampsJobData>,
    @InjectQueue(TOKEN_METADATA_QUEUE_NAME)
    private readonly tokenMetadataQueue: Queue<TokenMetadataJobData>,
    @InjectQueue(SPENDER_METADATA_QUEUE_NAME)
    private readonly spenderMetadataQueue: Queue<SpenderMetadataJobData>,
  ) {
    super();
  }

  async process(job: Job<EventsJobData>, token?: string): Promise<void> {
    const { eventsScanId, address, chainId, reason } = job.data;

    const result = await this.groupLimiter.runWithLimit(
      chainId,
      async () => {
        this.logger.debug({
          event: 'events_indexing_started',
          outcome: 'started',
          eventsScanId,
          chainId,
          address,
          reason,
        });
        return indexEvents(address, chainId);
      },
      { job, token },
    );

    if (result.nonceZeroSkipped) {
      this.logger.debug({
        event: 'events_indexing_completed',
        outcome: 'nonce_zero',
        eventsScanId,
        chainId,
        address,
        durationMs: result.durationMs,
      });
      return;
    }

    this.logger.log({ event: 'events_indexing_completed', outcome: 'ok', eventsScanId, chainId, address, ...result });

    if (result.logsWritten > 0) {
      await this.timestampsQueue.add('timestamps', { chainId }, { jobId: timestampsJobId(chainId) }).catch((error) => {
        this.logger.warn({
          event: 'timestamps_enqueue_failed',
          outcome: 'failed',
          eventsScanId,
          chainId,
          address,
          error: parseErrorMessage(error),
        });
      });
    }

    await this.allowancesQueue
      .add(
        'recompute',
        { address, chainId, eventsScanId },
        { jobId: allowanceRecomputeJobId(chainId, address, result.toBlock) },
      )
      .catch((error) => {
        this.logger.warn({
          event: 'allowance_recompute_enqueue_failed',
          outcome: 'failed',
          eventsScanId,
          chainId,
          address,
          error: parseErrorMessage(error),
        });
      });

    if (result.logsWritten === 0) return;

    const enqueued = await enqueueUnenrichedTokens(
      this.tokenMetadataQueue,
      { chainId, fromBlock: result.fromBlock, toBlock: result.toBlock, limit: null },
      'events',
    ).catch((error) => {
      this.logger.warn({
        event: 'token_metadata_enqueue_failed',
        outcome: 'failed',
        eventsScanId,
        chainId,
        error: parseErrorMessage(error),
      });
    });

    if (enqueued && enqueued > 0) {
      this.logger.debug({
        event: 'token_metadata_enqueue_completed',
        outcome: 'enqueued',
        eventsScanId,
        chainId,
        fromBlock: result.fromBlock,
        toBlock: result.toBlock,
        enqueued,
      });
    }

    const spenderMetadataEnqueued = await enqueueUnenrichedSpenders(
      this.spenderMetadataQueue,
      { address, chainId, fromBlock: result.fromBlock, toBlock: result.toBlock, limit: null },
      'events',
    ).catch((error) => {
      this.logger.warn({
        event: 'spender_metadata_enqueue_failed',
        outcome: 'failed',
        eventsScanId,
        chainId,
        error: parseErrorMessage(error),
      });
    });

    if (spenderMetadataEnqueued && spenderMetadataEnqueued > 0) {
      this.logger.debug({
        event: 'spender_metadata_enqueue_completed',
        outcome: 'enqueued',
        eventsScanId,
        chainId,
        fromBlock: result.fromBlock,
        toBlock: result.toBlock,
        enqueued: spenderMetadataEnqueued,
      });
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

    this.logger.error({
      event: 'events_indexing_failed',
      outcome: exhausted ? 'failed' : 'retrying',
      eventsScanId: job?.data?.eventsScanId,
      chainId: job?.data?.chainId,
      address: job?.data?.address,
      attempt,
      maxAttempts,
      exhausted,
      error: { message: parseErrorMessage(error), stack: error.stack },
    });

    if (!job?.data) return;

    const { eventsScanId, chainId, address } = job.data;

    // Only range/size-shaped errors should shrink the persisted max block range. Connectivity
    // errors say nothing about the range and are handled through `recordEventsFailure` below.
    if (isSplittableScanError(error)) {
      try {
        const nextMaxBlockRange = await reduceEventsMaxBlockRangeAfterFailure(address, chainId);
        this.logger.warn({
          event: 'events_max_block_range_reduced',
          outcome: 'reduced',
          eventsScanId,
          chainId,
          address,
          nextMaxBlockRange,
        });
      } catch (rangeError) {
        this.logger.warn({
          event: 'events_max_block_range_reduction_failed',
          outcome: 'failed',
          eventsScanId,
          chainId,
          address,
          error: parseErrorMessage(rangeError),
        });
      }
    }

    if (!exhausted) return;
    await recordEventsFailure(address, chainId, error);
  }
}
