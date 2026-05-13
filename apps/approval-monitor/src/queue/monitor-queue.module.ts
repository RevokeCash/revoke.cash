import { BullModule } from '@nestjs/bullmq';
import { type DynamicModule, Module } from '@nestjs/common';
import type { JobsOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { GroupLimiterModule } from './group-limiter.module';

export const MONITOR_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
} satisfies JobsOptions;

interface RegisterOptions {
  name: string;
  // Per-chain group limiter — `groupId` chooses the Bottleneck Group namespace, `maxConcurrent`
  // sizes the per-chain cap. Workloads that hit RPC heavily (scan) stay tight; lighter workloads
  // (enrichment) can run much higher per chain without overwhelming the underlying providers.
  limiter?: { groupId: string; maxConcurrent: number };
}

@Module({})
export class MonitorQueueModule {
  static register({ name, limiter }: RegisterOptions): DynamicModule {
    const bullRoot = BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    });
    const bullQueue = BullModule.registerQueue({ name, defaultJobOptions: MONITOR_DEFAULT_JOB_OPTIONS });
    const limiterModule = limiter ? [GroupLimiterModule.register(limiter)] : [];

    return {
      module: MonitorQueueModule,
      global: true,
      imports: [bullRoot, bullQueue, ...limiterModule],
      exports: [bullQueue, ...limiterModule],
    };
  }
}
