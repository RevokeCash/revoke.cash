import { Module } from '@nestjs/common';
import { MonitorQueueModule } from '../queue/monitor-queue.module';
import { ALLOWANCES_QUEUE_NAME } from './allowances.queue';
import { AllowancesWorker } from './allowances.worker';

@Module({
  imports: [
    MonitorQueueModule.register({
      name: ALLOWANCES_QUEUE_NAME,
      limiter: { groupId: 'monitor-allowance', maxConcurrent: 3, overflow: 'delay' },
    }),
  ],
  providers: [AllowancesWorker],
})
export class AllowancesWorkerModule {}
