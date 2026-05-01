import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { SCAN_DEFAULT_JOB_OPTIONS, SCAN_QUEUE_NAME } from './scan.queue';
import { ScanSchedulerService } from './scan.scheduler.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue({ name: SCAN_QUEUE_NAME, defaultJobOptions: SCAN_DEFAULT_JOB_OPTIONS }),
    SubscribersModule,
  ],
  providers: [ScanSchedulerService],
  exports: [BullModule],
})
export class ScanSchedulerModule {}
