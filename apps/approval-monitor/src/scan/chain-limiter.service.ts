import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { MINUTE } from '@revoke.cash/core/utils/time';
import Bottleneck from 'bottleneck';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';

export type ChainBusyError = Bottleneck.BottleneckError;
export const isChainBusyError = (error: unknown): boolean =>
  error instanceof Bottleneck.BottleneckError && /dropped/i.test(error.message);

@Injectable()
export class ChainLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(ChainLimiterService.name);
  private readonly group: Bottleneck.Group;

  constructor(@Inject(REDIS_CONNECTION) redis: Redis) {
    const connection = new Bottleneck.IORedisConnection({ client: redis });

    // highWater: 0 means that jobs over the concurrency limit are dropped (and get re-added later by the scheduler)
    this.group = new Bottleneck.Group({
      maxConcurrent: 3,
      highWater: 0,
      strategy: Bottleneck.strategy.OVERFLOW,
      datastore: 'ioredis',
      connection,
      timeout: 10 * MINUTE,
      id: 'monitor-chain',
    });

    this.group.on('error', (error) => {
      this.logger.error({ error }, 'chain limiter group error');
    });
  }

  async runWithLimit<T>(chainId: number, fn: () => Promise<T>): Promise<T | null> {
    try {
      return await this.group.key(String(chainId)).schedule(fn);
    } catch (error) {
      if (isChainBusyError(error)) return null;
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.group.disconnect(true).catch((error) => {
      this.logger.warn({ error }, 'failed to disconnect chain limiter group');
    });
  }
}
