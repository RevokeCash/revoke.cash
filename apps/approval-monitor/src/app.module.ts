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
      // Allowances pipeline doesn't have a scheduler — it's triggered by the scan worker on every successful scan
      ...(isManager
        ? [ScanSchedulerModule, TimestampsSchedulerModule, BullBoardModule]
        : [ScanWorkerModule, TimestampsWorkerModule, AllowancesWorkerModule]),
    ];

    return {
      module: AppModule,
      imports,
    };
  }
}
