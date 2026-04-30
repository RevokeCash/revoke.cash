import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { SCAN_DEFAULT_JOB_OPTIONS, scanQueueNameForChain } from './scan.queue';
import { ScanSchedulerService } from './scan.scheduler.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue(
      ...ORDERED_CHAINS.map((chainId) => ({
        name: scanQueueNameForChain(chainId),
        defaultJobOptions: SCAN_DEFAULT_JOB_OPTIONS,
      })),
    ),
    SubscribersModule,
  ],
  providers: [ScanSchedulerService],
  exports: [BullModule],
})
export class ScanSchedulerModule {}
