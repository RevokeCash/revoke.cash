import { Module } from '@nestjs/common';
import { IndexerQueueModule } from '../queue/indexer-queue.module';
import { ALLOWANCES_QUEUE_NAME } from './allowances.queue';
import { AllowancesWorker } from './allowances.worker';

@Module({
  imports: [
    IndexerQueueModule.register({
      name: ALLOWANCES_QUEUE_NAME,
      limiter: { groupId: 'indexer-allowance', maxConcurrent: 5, overflow: 'delay' },
    }),
  ],
  providers: [AllowancesWorker],
})
export class AllowancesWorkerModule {}
