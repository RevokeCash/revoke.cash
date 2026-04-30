import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { timestampsQueueNameForChain } from './timestamps.queue';
import { TimestampsSchedulerService } from './timestamps.scheduler.service';

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
};

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue(
      ...ORDERED_CHAINS.map((chainId) => ({
        name: timestampsQueueNameForChain(chainId),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      })),
    ),
  ],
  providers: [TimestampsSchedulerService],
  exports: [BullModule],
})
export class TimestampsSchedulerModule {}
