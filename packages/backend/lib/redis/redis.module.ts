import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import IORedis, { type Redis } from 'ioredis';

export const REDIS_CONNECTION = 'REDIS_CONNECTION';

const getRedisUrl = (): string => {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not configured');
  return url;
};

const redisProvider = {
  provide: REDIS_CONNECTION,
  useFactory: (): Redis => new IORedis(getRedisUrl(), { maxRetriesPerRequest: null }),
};

@Global()
@Module({
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CONNECTION) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit().catch(() => {});
  }
}
