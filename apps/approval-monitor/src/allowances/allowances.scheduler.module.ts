import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MonitorQueueModule } from '../queue/monitor-queue.module';
import { ALLOWANCES_QUEUE_NAME } from './allowances.queue';

// The allowances pipeline doesn't have a scheduler service of its own — jobs are enqueued by
// the scan worker post-success. This module exists to register the queue on the manager role
// so that Bull Board can introspect it; symmetric with ScanSchedulerModule and
// TimestampsSchedulerModule, just without the @Interval ticker.
@Module({
  imports: [MonitorQueueModule.register({ name: ALLOWANCES_QUEUE_NAME })],
  exports: [BullModule],
})
export class AllowancesSchedulerModule {}
