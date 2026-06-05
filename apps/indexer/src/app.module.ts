import { type DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from '@revoke.cash/backend/health/health.module';
import { BackendLoggerModule } from '@revoke.cash/backend/logger/logger.module';
import { RedisModule } from '@revoke.cash/backend/redis/redis.module';
import { AllowancesSchedulerModule } from './allowances/allowances.scheduler.module';
import { AllowancesWorkerModule } from './allowances/allowances.worker.module';
import { BullBoardModule } from './bull-board/bull-board.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { EventsSchedulerModule } from './events/events.scheduler.module';
import { EventsWorkerModule } from './events/events.worker.module';
import { MetricsModule } from './metrics/metrics.module';
import { TimestampsSchedulerModule } from './timestamps/timestamps.scheduler.module';
import { TimestampsWorkerModule } from './timestamps/timestamps.worker.module';
import { TokenMetadataSchedulerModule } from './token-metadata/token-metadata.scheduler.module';
import { TokenMetadataWorkerModule } from './token-metadata/token-metadata.worker.module';

@Module({})
export class AppModule {
  static register(): DynamicModule {
    const config = new ConfigService();
    const isManager = config.isManager;

    const imports = [
      ScheduleModule.forRoot(),
      BackendLoggerModule.register({ serviceName: 'indexer', role: config.role }),
      ConfigModule,
      RedisModule,
      HealthModule,
      MetricsModule,
      isManager ? EventsSchedulerModule : EventsWorkerModule,
      isManager ? AllowancesSchedulerModule : AllowancesWorkerModule,
      isManager ? TimestampsSchedulerModule : TimestampsWorkerModule,
      isManager ? TokenMetadataSchedulerModule : TokenMetadataWorkerModule,
      ...(isManager ? [BullBoardModule] : []),
    ];

    return {
      module: AppModule,
      imports,
    };
  }
}
