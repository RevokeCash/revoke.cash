import { type DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AllowancesWorkerModule } from './allowances/allowances.worker.module';
import { BullBoardModule } from './bull-board/bull-board.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { EventsSchedulerModule } from './events/events.scheduler.module';
import { EventsWorkerModule } from './events/events.worker.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { RedisModule } from './redis/redis.module';
import { TimestampsSchedulerModule } from './timestamps/timestamps.scheduler.module';
import { TimestampsWorkerModule } from './timestamps/timestamps.worker.module';
import { TokenMetadataSchedulerModule } from './token-metadata/token-metadata.scheduler.module';
import { TokenMetadataWorkerModule } from './token-metadata/token-metadata.worker.module';

@Module({})
export class AppModule {
  static register(): DynamicModule {
    const isManager = new ConfigService().isManager;
    const imports = [
      ScheduleModule.forRoot(),
      LoggerModule,
      ConfigModule,
      RedisModule,
      HealthModule,
      MetricsModule,
      ...(isManager
        ? [EventsSchedulerModule, TimestampsSchedulerModule, TokenMetadataSchedulerModule, BullBoardModule]
        : [EventsWorkerModule, TimestampsWorkerModule, AllowancesWorkerModule, TokenMetadataWorkerModule]),
    ];

    return {
      module: AppModule,
      imports,
    };
  }
}
