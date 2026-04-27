import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import IORedis, { type Redis } from 'ioredis';
import { ConfigService } from '../config/config.service';

export const REDIS_CONNECTION = 'REDIS_CONNECTION';

const redisProvider = {
  provide: REDIS_CONNECTION,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Redis => new IORedis(config.redisUrl, { maxRetriesPerRequest: null }),
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
