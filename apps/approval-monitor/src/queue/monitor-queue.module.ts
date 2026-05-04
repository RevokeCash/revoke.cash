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
  groupId?: string;
}

@Module({})
export class MonitorQueueModule {
  static register({ name, groupId }: RegisterOptions): DynamicModule {
    const bullRoot = BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    });
    const bullQueue = BullModule.registerQueue({ name, defaultJobOptions: MONITOR_DEFAULT_JOB_OPTIONS });
    const limiter = groupId ? [GroupLimiterModule.register(groupId)] : [];

    return {
      module: MonitorQueueModule,
      imports: [bullRoot, bullQueue, ...limiter],
      // Re-export the queue + limiter so consumers' DI sees `@InjectQueue(name)` and
      // `GroupLimiterService`. `bullRoot` doesn't need re-export — its providers are app-wide.
      exports: [bullQueue, ...limiter],
    };
  }
}
