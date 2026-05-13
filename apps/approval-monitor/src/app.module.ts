import { type DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AllowancesWorkerModule } from './allowances/allowances.worker.module';
import { BullBoardModule } from './bull-board/bull-board.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { RedisModule } from './redis/redis.module';
import { ScanSchedulerModule } from './scan/scan.scheduler.module';
import { ScanWorkerModule } from './scan/scan.worker.module';
import { TimestampsSchedulerModule } from './timestamps/timestamps.scheduler.module';
import { TimestampsWorkerModule } from './timestamps/timestamps.worker.module';
import { TokenEnrichmentSchedulerModule } from './token-enrichment/token-enrichment.scheduler.module';
import { TokenEnrichmentWorkerModule } from './token-enrichment/token-enrichment.worker.module';

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
        ? [ScanSchedulerModule, TimestampsSchedulerModule, TokenEnrichmentSchedulerModule, BullBoardModule]
        : [ScanWorkerModule, TimestampsWorkerModule, AllowancesWorkerModule, TokenEnrichmentWorkerModule]),
    ];

    return {
      module: AppModule,
      imports,
    };
  }
}
