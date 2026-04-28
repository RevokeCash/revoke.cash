import { type DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullBoardModule } from './bull-board/bull-board.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { WorkerModule } from './worker/worker.module';

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
      ...(isManager ? [QueueModule, BullBoardModule, SchedulerModule] : [WorkerModule]),
    ];

    return {
      module: AppModule,
      imports,
    };
  }
}
