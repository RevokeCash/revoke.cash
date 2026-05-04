import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MonitorQueueModule } from '../queue/monitor-queue.module';
import { TIMESTAMPS_QUEUE_NAME } from './timestamps.queue';
import { TimestampsSchedulerService } from './timestamps.scheduler.service';

@Module({
  imports: [MonitorQueueModule.register({ name: TIMESTAMPS_QUEUE_NAME })],
  providers: [TimestampsSchedulerService],
  exports: [BullModule],
})
export class TimestampsSchedulerModule {}
