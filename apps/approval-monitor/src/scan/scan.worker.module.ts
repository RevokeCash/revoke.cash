import { BullModule, Processor } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Redis } from 'ioredis';
import { ConfigService } from '../config/config.service';
import { MetricsService } from '../metrics/metrics.service';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { scanQueueNameForChain } from './scan.queue';
import { ScanWorker } from './scan.worker';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue(...ORDERED_CHAINS.map((chainId) => ({ name: scanQueueNameForChain(chainId) }))),
  ],
  providers: ORDERED_CHAINS.map((chainId) => ({
    provide: `SCAN_WORKER_${chainId}`,
    inject: [ConfigService, MetricsService],
    useFactory: (config: ConfigService, metrics: MetricsService) => {
      const queueName = scanQueueNameForChain(chainId);
      const concurrency = config.getChainConcurrency(chainId);

      @Processor(queueName, { concurrency, lockDuration: 90_000 })
      class ChainScanWorker extends ScanWorker {
        constructor() {
          super(chainId, metrics);
        }
      }

      return new ChainScanWorker();
    },
  })),
})
export class ScanWorkerModule {}
