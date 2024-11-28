import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { RateLimit } from 'lib/interfaces';
import PQueue from 'p-queue';

// This class is a light wrapper around both p-queue and upstash/ratelimit
// It uses Upstash if the UPSTASH_REDIS_REST_URL environment variable is set, otherwise it uses p-queue
export class RequestQueue {
  pQueue: PQueue;
  upstashQueue?: Ratelimit;

  constructor(
    public identifier: string,
    public rateLimit: RateLimit,
    private preferredQueue?: 'upstash' | 'p-queue',
  ) {
    this.pQueue = new PQueue(rateLimit);
    this.upstashQueue = process.env.UPSTASH_REDIS_REST_URL
      ? new Ratelimit({
          redis: Redis.fromEnv(),
          limiter: Ratelimit.slidingWindow(rateLimit.intervalCap, `${rateLimit.interval} ms`),
          analytics: true,
        })
      : undefined;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    // Use Upstash if it's available
    if (this.upstashQueue && this.preferredQueue !== 'p-queue') {
      const { success } = await this.upstashQueue.blockUntilReady(this.identifier, this.rateLimit.timeout ?? 10_000);

      if (!success) {
        throw new Error('Queued request timed out');
      }

      return fn();
    }

    // Fallback to p-queue
    return this.pQueue.add(fn, { throwOnTimeout: true });
  }
}
