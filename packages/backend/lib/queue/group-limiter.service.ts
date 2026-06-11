import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { MINUTE } from '@revoke.cash/core/utils/time';
import Bottleneck from 'bottleneck';
import { DelayedError, type Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';

export const GROUP_LIMITER_GROUP_ID = Symbol('GROUP_LIMITER_GROUP_ID');
export const GROUP_LIMITER_MAX_CONCURRENT = Symbol('GROUP_LIMITER_MAX_CONCURRENT');
export const GROUP_LIMITER_OVERFLOW_BEHAVIOR = Symbol('GROUP_LIMITER_OVERFLOW_BEHAVIOR');

// 'drop' drops the job entirely, 'queue' keeps the job in-memory in bottleneck's queue, 'delay' delays the job using BullMQ's moveToDelayed method
export type OverflowBehavior = 'drop' | 'queue' | 'delay';

export type GroupBusyError = Bottleneck.BottleneckError;
export const isGroupBusyError = (error: unknown): boolean =>
  error instanceof Bottleneck.BottleneckError && /dropped/i.test(error.message);

const DELAY_BASE_MS = 3_000;
const DELAY_JITTER_MS = 5_000;

interface JobContext {
  job: Job;
  token: string | undefined;
}

@Injectable()
export class GroupLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(GroupLimiterService.name);
  private readonly group: Bottleneck.Group;
  private readonly overflow: OverflowBehavior;

  constructor(
    @Inject(REDIS_CONNECTION) redis: Redis,
    @Inject(GROUP_LIMITER_GROUP_ID) groupId: string,
    @Inject(GROUP_LIMITER_MAX_CONCURRENT) maxConcurrent: number,
    @Inject(GROUP_LIMITER_OVERFLOW_BEHAVIOR) overflow: OverflowBehavior,
  ) {
    const connection = new Bottleneck.IORedisConnection({ client: redis });
    this.overflow = overflow;

    const rejectAtCapacity = overflow === 'drop' || overflow === 'delay';
    this.group = new Bottleneck.Group({
      maxConcurrent,
      ...(rejectAtCapacity ? { highWater: 0, strategy: Bottleneck.strategy.OVERFLOW } : {}),
      datastore: 'ioredis',
      connection,
      timeout: 10 * MINUTE,
      id: groupId,
    });

    this.group.on('error', (error) => {
      this.logger.error({ event: 'group_limiter_error', outcome: 'failed', error: parseErrorMessage(error), groupId });
    });
  }

  async runWithLimit<T>(groupKey: string | number, fn: () => Promise<T>): Promise<T | null>;
  async runWithLimit<T>(groupKey: string | number, fn: () => Promise<T>, jobContext: JobContext): Promise<T>;
  async runWithLimit<T>(groupKey: string | number, fn: () => Promise<T>, jobContext?: JobContext): Promise<T | null> {
    try {
      return await this.group.key(String(groupKey)).schedule(fn);
    } catch (error) {
      if (!isGroupBusyError(error)) throw error;

      if (this.overflow === 'queue') return null;

      if (this.overflow === 'delay') {
        if (!jobContext) {
          throw new Error(
            `GroupLimiterService configured with overflow='delay' but runWithLimit called without jobContext`,
          );
        }
        const delay = DELAY_BASE_MS + Math.random() * DELAY_JITTER_MS;
        await jobContext.job.moveToDelayed(Date.now() + delay, jobContext.token);
        throw new DelayedError();
      }

      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.group.disconnect(true).catch((error) => {
      this.logger.warn({
        event: 'group_limiter_disconnect_failed',
        outcome: 'failed',
        error: parseErrorMessage(error),
      });
    });
  }
}
