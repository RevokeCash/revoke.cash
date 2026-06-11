import { Module } from '@nestjs/common';
import { TIMESTAMPS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/timestamps';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { TimestampsSchedulerService } from './timestamps.scheduler.service';

@Module({
  imports: [QueueModule.register({ name: TIMESTAMPS_QUEUE_NAME })],
  providers: [TimestampsSchedulerService],
})
export class TimestampsSchedulerModule {}
