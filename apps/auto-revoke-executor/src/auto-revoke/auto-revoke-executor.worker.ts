import { randomUUID } from 'node:crypto';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AUTO_REVOKE_EXECUTE_QUEUE_NAME, type AutoRevokeExecuteJobData } from '@revoke.cash/backend/auto-revoke/queue';
import {
  autoRevokeEventsJobId,
  EVENTS_QUEUE_NAME,
  type EventsJobData,
} from '@revoke.cash/backend/indexer/queues/events';
import { GroupLimiterService } from '@revoke.cash/backend/queue/group-limiter.service';
import { processAction } from '@revoke.cash/core/auto-revoke/execution';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job, Queue } from 'bullmq';
import type { Address } from 'viem';
import { SignerService } from './signer.service';

@Processor(AUTO_REVOKE_EXECUTE_QUEUE_NAME, { concurrency: 10, lockDuration: 90_000 })
export class AutoRevokeExecutorWorker extends WorkerHost {
  private readonly logger = new Logger(AutoRevokeExecutorWorker.name);

  constructor(
    private readonly signer: SignerService,
    private readonly groupLimiter: GroupLimiterService,
    @InjectQueue(EVENTS_QUEUE_NAME) private readonly eventsQueue: Queue<EventsJobData>,
  ) {
    super();
  }

  async process(job: Job<AutoRevokeExecuteJobData>, token?: string): Promise<void> {
    const { actionId, chainId } = job.data;

    const result = await this.groupLimiter.runWithLimit(chainId, () => processAction(actionId, this.signer), {
      job,
      token,
    });

    if (result.completed) {
      this.logger.log({
        event: 'auto_revoke_action_processed',
        outcome: result.succeeded ? 'succeeded' : (result.reason ?? 'failed'),
        actionId,
        chainId,
        txHash: result.txHash,
      });

      if (result.succeeded && result.address) {
        await this.enqueueReindex(actionId, result.address, chainId);
      }
      return;
    }

    this.logger.log({
      event: 'auto_revoke_action_processed',
      outcome: result.submitted ? 'submitted' : (result.reason ?? 'not_submitted'),
      actionId,
      chainId,
      txHash: result.txHash,
      detail: result.detail,
    });
  }

  private async enqueueReindex(actionId: string, address: Address, chainId: number): Promise<void> {
    const eventsScanId = randomUUID();
    await this.eventsQueue
      .add(
        'events',
        { eventsScanId, address, chainId, reason: 'auto_revoke', scheduledAt: Date.now() },
        { jobId: autoRevokeEventsJobId(chainId, address, actionId) },
      )
      .catch((error) => {
        this.logger.warn({
          event: 'auto_revoke_reindex_enqueue_failed',
          outcome: 'failed',
          actionId,
          chainId,
          error: parseErrorMessage(error),
        });
      });
  }
}
