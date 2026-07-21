import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { type DynamicModule, Logger, Module } from '@nestjs/common';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { JobsOptions, Queue } from 'bullmq';
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

    // Without an 'error' listener on each Queue, BullMQ dumps Redis connection errors to
    // console.error as raw multi-line stacks; route them through the structured logger instead.
    const queueErrorLogger = {
      provide: `QUEUE_ERROR_LOGGER_${name}`,
      inject: [getQueueToken(name)],
      useFactory: (queue: Queue): void => {
        const logger = new Logger(QueueModule.name);
        queue.on('error', (error) => {
          logger.error({
            event: 'queue_error',
            queue: name,
            error: { message: parseErrorMessage(error), stack: error.stack },
          });
        });
      },
    };

    return {
      module: QueueModule,
      global: true,
      imports: [bullRoot, bullQueue, ...limiterModule],
      providers: [queueErrorLogger],
      exports: [bullQueue, ...limiterModule],
    };
  }
}
