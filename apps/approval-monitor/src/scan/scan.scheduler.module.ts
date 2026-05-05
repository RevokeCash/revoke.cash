import { Module } from '@nestjs/common';
import { MonitorQueueModule } from '../queue/monitor-queue.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { SCAN_QUEUE_NAME } from './scan.queue';
import { ScanSchedulerService } from './scan.scheduler.service';

@Module({
  imports: [MonitorQueueModule.register({ name: SCAN_QUEUE_NAME }), SubscribersModule],
  providers: [ScanSchedulerService],
})
export class ScanSchedulerModule {}
