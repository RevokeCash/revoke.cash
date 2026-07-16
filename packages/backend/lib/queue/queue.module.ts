import { BullModule } from '@nestjs/bullmq';
import { type DynamicModule, Module } from '@nestjs/common';
import type { JobsOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { GroupLimiterModule } from './group-limiter.module';
import type { OverflowBehavior } from './group-limiter.service';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
} satisfies JobsOptions;

interface RegisterOptions {
  name: string;
  limiter?: { groupId: string; maxConcurrent: number; overflow: OverflowBehavior };
  jobOptions?: Partial<JobsOptions>;
}

@Module({})
export class QueueModule {
  static register({ name, limiter, jobOptions }: RegisterOptions): DynamicModule {
    const bullRoot = BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    });
    const bullQueue = BullModule.registerQueue({
      name,
      defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, ...jobOptions },
    });
    const limiterModule = limiter ? [GroupLimiterModule.register(limiter)] : [];

    return {
      module: QueueModule,
      global: true,
      imports: [bullRoot, bullQueue, ...limiterModule],
      exports: [bullQueue, ...limiterModule],
    };
  }
}
