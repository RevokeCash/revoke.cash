import { Module } from '@nestjs/common';
import { TIMESTAMPS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/timestamps';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { TimestampsWorker } from './timestamps.worker';

@Module({
  // No groupId: the timestamps worker isn't per-chain-limited (one job per chain per tick is
  // already its own pacing mechanism, and the work is RPC-bounded by viem JSON-RPC batching).
  imports: [QueueModule.register({ name: TIMESTAMPS_QUEUE_NAME })],
  providers: [TimestampsWorker],
})
export class TimestampsWorkerModule {}
