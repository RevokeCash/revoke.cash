import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { TIMESTAMPS_DEFAULT_JOB_OPTIONS, TIMESTAMPS_QUEUE_NAME } from './timestamps.queue';
import { TimestampsSchedulerService } from './timestamps.scheduler.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue({ name: TIMESTAMPS_QUEUE_NAME, defaultJobOptions: TIMESTAMPS_DEFAULT_JOB_OPTIONS }),
  ],
  providers: [TimestampsSchedulerService],
  exports: [BullModule],
})
export class TimestampsSchedulerModule {}
