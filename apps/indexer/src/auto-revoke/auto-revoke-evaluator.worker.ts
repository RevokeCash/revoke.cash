import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import {
  AUTO_REVOKE_EVALUATE_QUEUE_NAME,
  type AutoRevokeEvaluateJobData,
} from '@revoke.cash/backend/auto-revoke/evaluation-queue';
import { evaluateAddress } from '@revoke.cash/core/auto-revoke/evaluator';
import type { Job } from 'bullmq';

@Processor(AUTO_REVOKE_EVALUATE_QUEUE_NAME, { concurrency: 25, lockDuration: 90_000 })
export class AutoRevokeEvaluatorWorker extends WorkerHost {
  private readonly logger = new Logger(AutoRevokeEvaluatorWorker.name);

  async process(job: Job<AutoRevokeEvaluateJobData>): Promise<void> {
    const { address, chainId, reason, eventsScanId } = job.data;
    const result = await evaluateAddress(address, chainId);

    if (result.skipped) {
      const skipReason = result.reason ?? 'unknown';
      this.logger.debug({
        event: 'auto_revoke_evaluation_completed',
        outcome: 'skipped',
        address,
        chainId,
        reason,
        eventsScanId,
        skipReason,
      });
      return;
    }

    this.logger.log({
      event: 'auto_revoke_evaluation_completed',
      outcome: 'observations_recorded',
      address,
      chainId,
      reason,
      eventsScanId,
      observations: result.observations.length,
    });
  }
}
