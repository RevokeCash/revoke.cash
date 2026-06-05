import { Module } from '@nestjs/common';
import { TIMESTAMPS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/timestamps';
import { BackendQueueModule } from '@revoke.cash/backend/queue/backend-queue.module';
import { TimestampsSchedulerService } from './timestamps.scheduler.service';

@Module({
  imports: [BackendQueueModule.register({ name: TIMESTAMPS_QUEUE_NAME })],
  providers: [TimestampsSchedulerService],
})
export class TimestampsSchedulerModule {}
