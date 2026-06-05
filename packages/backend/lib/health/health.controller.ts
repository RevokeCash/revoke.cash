import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthIndicatorResult } from '@nestjs/terminus';
import { getDb } from '@revoke.cash/core/db/client';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { sql } from 'drizzle-orm';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    @Inject(REDIS_CONNECTION) private readonly redis: Redis,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.checkDatabase(), () => this.checkRedis()]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await getDb().execute(sql`SELECT 1`);
      return { database: { status: 'up' } };
    } catch (error) {
      return { database: { status: 'down', error: parseErrorMessage(error) } };
    }
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();
      return { redis: { status: 'up' } };
    } catch (error) {
      return { redis: { status: 'down', error: parseErrorMessage(error) } };
    }
  }
}
