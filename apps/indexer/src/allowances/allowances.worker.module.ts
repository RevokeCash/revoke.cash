import { Module } from '@nestjs/common';
import { AUTO_REVOKE_EVALUATE_QUEUE_NAME } from '@revoke.cash/backend/auto-revoke/evaluation-queue';
import { ALLOWANCES_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/allowances';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { AllowancesWorker } from './allowances.worker';

@Module({
  imports: [
    QueueModule.register({
      name: ALLOWANCES_QUEUE_NAME,
      limiter: { groupId: 'indexer-allowance', maxConcurrent: 5, overflow: 'delay' },
    }),
    QueueModule.register({ name: AUTO_REVOKE_EVALUATE_QUEUE_NAME }),
  ],
  providers: [AllowancesWorker],
})
export class AllowancesWorkerModule {}
