import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [QueueModule, SubscribersModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
