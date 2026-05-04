import { Module } from '@nestjs/common';
import { MonitorQueueModule } from '../queue/monitor-queue.module';
import { TIMESTAMPS_QUEUE_NAME } from './timestamps.queue';
import { TimestampsWorker } from './timestamps.worker';

@Module({
  // No groupId: the timestamps worker isn't per-chain-limited (one job per chain per tick is
  // already its own pacing mechanism, and the work is RPC-bounded by viem JSON-RPC batching).
  imports: [MonitorQueueModule.register({ name: TIMESTAMPS_QUEUE_NAME })],
  providers: [TimestampsWorker],
})
export class TimestampsWorkerModule {}
