import { BullModule, Processor } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Redis } from 'ioredis';
import { ConfigService } from '../config/config.service';
import { queueNameForChain } from '../queue/queue.service';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { ScanWorker } from './scan.worker';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue(...ORDERED_CHAINS.map((chainId) => ({ name: queueNameForChain(chainId) }))),
  ],
  // We use a factory to create a new worker for each chain because the @Processor decorator needs the queue name at class-definition time.
  providers: ORDERED_CHAINS.map((chainId) => ({
    provide: `SCAN_WORKER_${chainId}`,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const queueName = queueNameForChain(chainId);
      const concurrency = config.getChainConcurrency(chainId);

      @Processor(queueName, { concurrency })
      class ChainScanWorker extends ScanWorker {
        constructor() {
          super(chainId);
        }
      }

      return new ChainScanWorker();
    },
  })),
})
export class WorkerModule {}
