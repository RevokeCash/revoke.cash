import { Module } from '@nestjs/common';
import { IndexerQueueModule } from '../queue/indexer-queue.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { EVENTS_QUEUE_NAME } from './events.queue';
import { EventsSchedulerService } from './events.scheduler.service';

@Module({
  imports: [IndexerQueueModule.register({ name: EVENTS_QUEUE_NAME }), SubscribersModule],
  providers: [EventsSchedulerService],
})
export class EventsSchedulerModule {}
