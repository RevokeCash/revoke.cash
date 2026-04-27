import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { QueueService, queueNameForChain } from './queue.service';

// Note: both removeOnComplete and removeOnFail must remove immediately (`true`), not after a
// retention window, because BullMQ's jobId dedup blocks any add for an existing job in *any*  state
const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
};

/**
 * Queue plumbing for the manager replica:
 *   - Configures the shared BullMQ Redis connection
 *   - Registers one Queue per chain via @nestjs/bullmq
 *   - Exposes QueueService — a thin wrapper that resolves the registered queues into a Map for fast lookup
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue(
      ...ORDERED_CHAINS.map((chainId) => ({
        name: queueNameForChain(chainId),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      })),
    ),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
