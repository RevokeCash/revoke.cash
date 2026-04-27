import { type DynamicModule, Module } from '@nestjs/common';
import { BullBoardModule } from './bull-board/bull-board.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { WorkerModule } from './worker/worker.module';

/**
 * Manager replicas (`IS_MANAGER=true`):
 *   - SchedulerModule runs the @Cron loop and enqueues scan jobs.
 *   - QueueModule provides Queue instances for the scheduler (and future ad-hoc enqueues).
 *   - BullBoardModule mounts the admin dashboard at /queues (basic-auth gated).
 *
 * Worker replicas (default):
 *   - WorkerModule spawns per-chain BullMQ Workers that consume scan jobs.
 *
 * Both run the health endpoint on `PORT`.
 */
@Module({})
export class AppModule {
  static register(): DynamicModule {
    const isManager = new ConfigService().isManager;
    const imports = [
      LoggerModule,
      ConfigModule,
      RedisModule,
      HealthModule,
      ...(isManager ? [QueueModule, BullBoardModule, SchedulerModule] : [WorkerModule]),
    ];

    return {
      module: AppModule,
      imports,
    };
  }
}
