import { Module } from '@nestjs/common';
import { EVENTS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/events';
import { BackendQueueModule } from '@revoke.cash/backend/queue/backend-queue.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { EventsSchedulerService } from './events.scheduler.service';

@Module({
  imports: [BackendQueueModule.register({ name: EVENTS_QUEUE_NAME }), SubscribersModule],
  providers: [EventsSchedulerService],
})
export class EventsSchedulerModule {}
