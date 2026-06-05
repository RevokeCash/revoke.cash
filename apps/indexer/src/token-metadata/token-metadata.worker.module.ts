import { Module } from '@nestjs/common';
import { TOKEN_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/token-metadata';
import { BackendQueueModule } from '@revoke.cash/backend/queue/backend-queue.module';
import { TokenMetadataWorker } from './token-metadata.worker';

@Module({
  imports: [
    BackendQueueModule.register({
      name: TOKEN_METADATA_QUEUE_NAME,
      limiter: { groupId: 'indexer-token-metadata', maxConcurrent: 50, overflow: 'delay' },
    }),
  ],
  providers: [TokenMetadataWorker],
})
export class TokenMetadataWorkerModule {}
