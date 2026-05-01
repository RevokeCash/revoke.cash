import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { ChainLimiterService } from './chain-limiter.service';
import { SCAN_QUEUE_NAME } from './scan.queue';
import { ScanWorker } from './scan.worker';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue({ name: SCAN_QUEUE_NAME }),
  ],
  providers: [ChainLimiterService, ScanWorker],
})
export class ScanWorkerModule {}
