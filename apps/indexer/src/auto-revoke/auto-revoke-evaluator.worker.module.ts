import { Module } from '@nestjs/common';
import { AUTO_REVOKE_EVALUATE_QUEUE_NAME } from '@revoke.cash/backend/auto-revoke/evaluation-queue';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { AutoRevokeEvaluatorWorker } from './auto-revoke-evaluator.worker';

@Module({
  imports: [QueueModule.register({ name: AUTO_REVOKE_EVALUATE_QUEUE_NAME })],
  providers: [AutoRevokeEvaluatorWorker],
})
export class AutoRevokeEvaluatorWorkerModule {}
