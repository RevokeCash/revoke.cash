import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { MINUTE } from '@revoke.cash/core/utils/time';
import Bottleneck from 'bottleneck';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';

// Module-internal injection tokens, wired by `GroupLimiterModule.register({ groupId,
// maxConcurrent })`. Consumers import that module instead of touching these directly.
export const GROUP_LIMITER_GROUP_ID = Symbol('GROUP_LIMITER_GROUP_ID');
export const GROUP_LIMITER_MAX_CONCURRENT = Symbol('GROUP_LIMITER_MAX_CONCURRENT');

export type GroupBusyError = Bottleneck.BottleneckError;
export const isGroupBusyError = (error: unknown): boolean =>
  error instanceof Bottleneck.BottleneckError && /dropped/i.test(error.message);

@Injectable()
export class GroupLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(GroupLimiterService.name);
  private readonly group: Bottleneck.Group;

  constructor(
    @Inject(REDIS_CONNECTION) redis: Redis,
    @Inject(GROUP_LIMITER_GROUP_ID) groupId: string,
    @Inject(GROUP_LIMITER_MAX_CONCURRENT) maxConcurrent: number,
  ) {
    const connection = new Bottleneck.IORedisConnection({ client: redis });

    // highWater: 0 means that jobs over the concurrency limit are dropped (and get re-added later by the scheduler)
    this.group = new Bottleneck.Group({
      maxConcurrent,
      highWater: 0,
      strategy: Bottleneck.strategy.OVERFLOW,
      datastore: 'ioredis',
      connection,
      timeout: 10 * MINUTE,
      id: groupId,
    });

    this.group.on('error', (error) => {
      this.logger.error({ error: parseErrorMessage(error), groupId }, 'group limiter error');
    });
  }

  async runWithLimit<T>(groupKey: string | number, fn: () => Promise<T>): Promise<T | null> {
    try {
      return await this.group.key(String(groupKey)).schedule(fn);
    } catch (error) {
      if (isGroupBusyError(error)) return null;
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.group.disconnect(true).catch((error) => {
      this.logger.warn({ error: parseErrorMessage(error) }, 'failed to disconnect group limiter');
    });
  }
}
