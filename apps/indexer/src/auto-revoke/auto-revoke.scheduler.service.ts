import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  AUTO_REVOKE_EXECUTE_QUEUE_NAME,
  type AutoRevokeExecuteJobData,
  autoRevokeExecuteJobId,
} from '@revoke.cash/backend/auto-revoke/queue';
import {
  type Action,
  createMissingActions,
  findProcessableActions,
  unblockActions,
} from '@revoke.cash/core/auto-revoke/actions';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { SECOND } from '@revoke.cash/core/utils/time';
import type { Queue } from 'bullmq';

const TICK_INTERVAL_MS = 30 * SECOND;
const BATCH_SIZE = 500;

type EnqueueOutcome = 'added' | 'failed';

@Injectable()
export class AutoRevokeSchedulerService {
  private readonly logger = new Logger(AutoRevokeSchedulerService.name);

  constructor(
    @InjectQueue(AUTO_REVOKE_EXECUTE_QUEUE_NAME) private readonly executeQueue: Queue<AutoRevokeExecuteJobData>,
  ) {}

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    const unblockedActions = await unblockActions(BATCH_SIZE);
    const createdActions = await createMissingActions(BATCH_SIZE);
    const processableActions = await findProcessableActions(BATCH_SIZE);

    const executeOutcomes = await Promise.all(processableActions.map((action) => this.enqueueExecuteJob(action)));
    const executeCounts = countOutcomes(executeOutcomes);

    if (executeOutcomes.length > 0 || createdActions.length > 0 || unblockedActions.length > 0) {
      this.logger.log({
        event: 'auto_revoke_scheduler_tick_completed',
        outcome: 'completed',
        unblockedActions: unblockedActions.length,
        createdActions: createdActions.length,
        executeAdded: executeCounts.added,
        executeFailed: executeCounts.failed,
      });
    }
  }

  // Adding with a deterministic jobId is a no-op when the job is already queued or running.
  private async enqueueExecuteJob(action: Action): Promise<EnqueueOutcome> {
    return this.executeQueue
      .add(
        'execute',
        { actionId: action.id, chainId: action.observation.chainId },
        { jobId: autoRevokeExecuteJobId(action.id) },
      )
      .then(() => 'added' as const)
      .catch((error) => {
        this.logger.warn({
          event: 'auto_revoke_execution_enqueue_failed',
          outcome: 'failed',
          actionId: action.id,
          chainId: action.observation.chainId,
          error: parseErrorMessage(error),
        });
        return 'failed' as const;
      });
  }
}

const countOutcomes = (outcomes: EnqueueOutcome[]) => ({
  added: outcomes.filter((outcome) => outcome === 'added').length,
  failed: outcomes.filter((outcome) => outcome === 'failed').length,
});
