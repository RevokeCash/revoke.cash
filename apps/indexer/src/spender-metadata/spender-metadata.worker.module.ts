import { Module } from '@nestjs/common';
import { SPENDER_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/spender-metadata';
import { BackendQueueModule } from '@revoke.cash/backend/queue/backend-queue.module';
import { SpenderMetadataWorker } from './spender-metadata.worker';

@Module({
  imports: [
    BackendQueueModule.register({
      name: SPENDER_METADATA_QUEUE_NAME,
      limiter: { groupId: 'indexer-spender-metadata', maxConcurrent: 50, overflow: 'delay' },
    }),
  ],
  providers: [SpenderMetadataWorker],
})
export class SpenderMetadataWorkerModule {}
