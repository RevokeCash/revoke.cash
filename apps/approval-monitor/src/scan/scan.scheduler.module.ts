import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { scanQueueNameForChain } from './scan.queue';
import { ScanSchedulerService } from './scan.scheduler.service';

// Note: both removeOnComplete and removeOnFail must remove immediately (`true`), not after a
// retention window, because BullMQ's jobId dedup blocks any add for an existing job in *any* state.
const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
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
        name: scanQueueNameForChain(chainId),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      })),
    ),
    SubscribersModule,
  ],
  providers: [ScanSchedulerService],
  exports: [BullModule],
})
export class ScanSchedulerModule {}
