import { randomUUID } from 'node:crypto';
import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import {
  ALLOWANCES_QUEUE_NAME,
  type AllowancesJobData,
  allowanceRecomputeJobId,
} from '@revoke.cash/backend/indexer/queues/allowances';
import { catchupEventsJobId, EVENTS_QUEUE_NAME, type EventsJobData } from '@revoke.cash/backend/indexer/queues/events';
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
import {
  enqueueUnclassifiedTransferTransactions,
  TRANSFER_DETAILS_QUEUE_NAME,
  type TransferDetailsJobData,
} from '@revoke.cash/backend/indexer/queues/transfer-details';
import { GroupLimiterService } from '@revoke.cash/backend/queue/group-limiter.service';
import {
  floorEventsMaxBlockRangeAfterStall,
  indexEvents,
  isSplittableScanError,
  recordEventsFailure,
  reduceEventsMaxBlockRangeAfterFailure,
} from '@revoke.cash/core/indexer/events';
import { hasActivePremiumEntitlement } from '@revoke.cash/core/premium/entitlements';
import { isApprovedTransfersSupportedChain } from '@revoke.cash/core/transfers/config';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job, Queue } from 'bullmq';
import type { Address } from 'viem';

@Processor(EVENTS_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000, maxStalledCount: 2 })
export class EventsWorker extends WorkerHost {
  private readonly logger = new Logger(EventsWorker.name);

  constructor(
    private readonly groupLimiter: GroupLimiterService,
    @InjectQueue(EVENTS_QUEUE_NAME) private readonly eventsQueue: Queue<EventsJobData>,
    @InjectQueue(ALLOWANCES_QUEUE_NAME) private readonly allowancesQueue: Queue<AllowancesJobData>,
    @InjectQueue(TIMESTAMPS_QUEUE_NAME) private readonly timestampsQueue: Queue<TimestampsJobData>,
    @InjectQueue(TOKEN_METADATA_QUEUE_NAME)
    private readonly tokenMetadataQueue: Queue<TokenMetadataJobData>,
    @InjectQueue(SPENDER_METADATA_QUEUE_NAME)
    private readonly spenderMetadataQueue: Queue<SpenderMetadataJobData>,
    @InjectQueue(TRANSFER_DETAILS_QUEUE_NAME)
    private readonly transferDetailsQueue: Queue<TransferDetailsJobData>,
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

    if (result.isDisabled) {
      this.logger.debug({ event: 'events_indexing_completed', outcome: 'disabled', eventsScanId, chainId, address });
      return;
    }

    this.logger.log({ event: 'events_indexing_completed', outcome: 'ok', eventsScanId, chainId, address, ...result });

    // If the result was capped, we immediately queue another scan, so we can catch up faster than if we wait for the scheduler to pick it up
    // Catchup scans skip the scheduler, which is the only place the active subscription is checked, so an address whose subscription ended
    // breaks the chain here (a manually paused address is already skipped by indexEvents)
    if (result.isCapped && (await hasActivePremiumEntitlement(address))) {
      await this.enqueueCatchupScan(chainId, address, result.toBlock, eventsScanId);
    }

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

      if (isApprovedTransfersSupportedChain(chainId)) {
        await enqueueUnclassifiedTransferTransactions(this.transferDetailsQueue, chainId, 'events', address).catch(
          (error) => {
            this.logger.warn({
              event: 'transfer_details_enqueue_failed',
              outcome: 'failed',
              eventsScanId,
              chainId,
              address,
              error: parseErrorMessage(error),
            });
          },
        );
      }
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

  private async enqueueCatchupScan(
    chainId: number,
    address: Address,
    lastToBlock: number,
    previousEventsScanId: string,
  ): Promise<void> {
    try {
      await this.eventsQueue.add(
        'events',
        { eventsScanId: randomUUID(), address, chainId, reason: 'catchup', scheduledAt: Date.now() },
        { jobId: catchupEventsJobId(chainId, address, lastToBlock) },
      );

      this.logger.debug({
        event: 'events_catchup_enqueued',
        outcome: 'enqueued',
        eventsScanId: previousEventsScanId,
        chainId,
        address,
        lastToBlock,
      });
    } catch (error) {
      // The wallet's `next_run_at` is already set to the catchup fallback interval, so the scheduler
      // picks it back up shortly — a failed chain slows catchup down, it does not stall it
      this.logger.warn({
        event: 'events_catchup_enqueue_failed',
        outcome: 'failed',
        eventsScanId: previousEventsScanId,
        chainId,
        address,
        error: parseErrorMessage(error),
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
    // After 3 stalled attempts,, it arrives here as `UnrecoverableError`, so we'll stop retrying and record the failure
    const exhausted = attempt >= maxAttempts || error.name === 'UnrecoverableError';

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

    const { chainId, address } = job.data;

    if (isSplittableScanError(error)) {
      await this.reduceMaxBlockRange(job.data, 'scan_error');
    }

    if (!exhausted) return;
    await recordEventsFailure(address, chainId, error);
  }

  @OnWorkerEvent('stalled')
  async onStalled(jobId: string): Promise<void> {
    const job = await this.eventsQueue.getJob(jobId).catch(() => undefined);
    if (!job?.data) return;

    this.logger.warn({
      event: 'events_indexing_stalled',
      outcome: 'stalled',
      eventsScanId: job.data.eventsScanId,
      chainId: job.data.chainId,
      address: job.data.address,
    });

    await this.reduceMaxBlockRange(job.data, 'stalled');
  }

  private async reduceMaxBlockRange(jobData: EventsJobData, trigger: 'scan_error' | 'stalled'): Promise<void> {
    const { eventsScanId, chainId, address } = jobData;
    try {
      const nextMaxBlockRange =
        trigger === 'stalled'
          ? await floorEventsMaxBlockRangeAfterStall(address, chainId)
          : await reduceEventsMaxBlockRangeAfterFailure(address, chainId);

      this.logger.warn({
        event: 'events_max_block_range_reduced',
        outcome: 'reduced',
        eventsScanId,
        chainId,
        address,
        trigger,
        nextMaxBlockRange,
      });
    } catch (error) {
      this.logger.warn({
        event: 'events_max_block_range_reduction_failed',
        outcome: 'failed',
        eventsScanId,
        chainId,
        address,
        trigger,
        error: parseErrorMessage(error),
      });
    }
  }
}
