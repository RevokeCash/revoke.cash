import { BullModule, Processor } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Redis } from 'ioredis';
import { REDIS_CONNECTION } from '../redis/redis.module';
import { timestampsQueueNameForChain } from './timestamps.queue';
import { TimestampsWorker } from './timestamps.worker';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => ({ connection }),
    }),
    BullModule.registerQueue(...ORDERED_CHAINS.map((chainId) => ({ name: timestampsQueueNameForChain(chainId) }))),
  ],
  providers: ORDERED_CHAINS.map((chainId) => ({
    provide: `TIMESTAMPS_WORKER_${chainId}`,
    useFactory: () => {
      const queueName = timestampsQueueNameForChain(chainId);

      @Processor(queueName, { concurrency: 1, lockDuration: 90_000 })
      class ChainTimestampsWorker extends TimestampsWorker {
        constructor() {
          super(chainId);
        }
      }

      return new ChainTimestampsWorker();
    },
  })),
})
export class TimestampsWorkerModule {}
