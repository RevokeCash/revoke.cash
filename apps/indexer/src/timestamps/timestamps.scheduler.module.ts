import { Module } from '@nestjs/common';
import { IndexerQueueModule } from '../queue/indexer-queue.module';
import { TIMESTAMPS_QUEUE_NAME } from './timestamps.queue';
import { TimestampsSchedulerService } from './timestamps.scheduler.service';

@Module({
  imports: [IndexerQueueModule.register({ name: TIMESTAMPS_QUEUE_NAME })],
  providers: [TimestampsSchedulerService],
})
export class TimestampsSchedulerModule {}
