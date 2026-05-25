import { Module } from '@nestjs/common';
import { IndexerQueueModule } from '../queue/indexer-queue.module';
import { ALLOWANCES_QUEUE_NAME } from './allowances.queue';

// The allowances pipeline doesn't have a scheduler service of its own — jobs are enqueued by
// the events worker post-success. This module exists to register the queue on the manager role
// so that Bull Board can introspect it; symmetric with EventsSchedulerModule and
// TimestampsSchedulerModule, just without the @Interval ticker.
@Module({
  imports: [IndexerQueueModule.register({ name: ALLOWANCES_QUEUE_NAME })],
})
export class AllowancesSchedulerModule {}
