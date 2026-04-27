import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from '../queue/queue.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), QueueModule, SubscribersModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
