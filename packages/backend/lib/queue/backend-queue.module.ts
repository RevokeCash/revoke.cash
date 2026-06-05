import { BullModule } from '@nestjs/bullmq';
import { type DynamicModule, Module } from '@nestjs/common';
import type { JobsOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { GroupLimiterModule } from './group-limiter.module';
import type { OverflowBehavior } from './group-limiter.service';

export const BACKEND_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
} satisfies JobsOptions;

interface RegisterOptions {
  name: string;
  limiter?: { groupId: string; maxConcurrent: number; overflow: OverflowBehavior };
}

@Module({})
export class BackendQueueModule {
  static register({ name, limiter }: RegisterOptions): DynamicModule {
    const bullRoot = BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    });
    const bullQueue = BullModule.registerQueue({ name, defaultJobOptions: BACKEND_DEFAULT_JOB_OPTIONS });
    const limiterModule = limiter ? [GroupLimiterModule.register(limiter)] : [];

    return {
      module: BackendQueueModule,
      global: true,
      imports: [bullRoot, bullQueue, ...limiterModule],
      exports: [bullQueue, ...limiterModule],
    };
  }
}
