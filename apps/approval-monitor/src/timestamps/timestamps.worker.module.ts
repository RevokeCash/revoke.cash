import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { TIMESTAMPS_QUEUE_NAME } from './timestamps.queue';
import { TimestampsWorker } from './timestamps.worker';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue({ name: TIMESTAMPS_QUEUE_NAME }),
  ],
  providers: [TimestampsWorker],
})
export class TimestampsWorkerModule {}
