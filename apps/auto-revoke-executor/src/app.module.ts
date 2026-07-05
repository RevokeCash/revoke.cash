import { Module } from '@nestjs/common';
import { HealthModule } from '@revoke.cash/backend/health/health.module';
import { LoggerModule } from '@revoke.cash/backend/logger/logger.module';
import { RedisModule } from '@revoke.cash/backend/redis/redis.module';
import { AutoRevokeExecutorWorkerModule } from './auto-revoke/auto-revoke-executor.worker.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    LoggerModule.register({ serviceName: 'auto-revoke-executor' }),
    ConfigModule,
    RedisModule,
    HealthModule,
    AutoRevokeExecutorWorkerModule,
  ],
})
export class AppModule {}
