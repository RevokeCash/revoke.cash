import { Module } from '@nestjs/common';
import { TOKEN_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/token-metadata';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { TokenMetadataWorker } from './token-metadata.worker';

@Module({
  imports: [
    QueueModule.register({
      name: TOKEN_METADATA_QUEUE_NAME,
      limiter: { groupId: 'indexer-token-metadata', maxConcurrent: 50, overflow: 'delay' },
    }),
  ],
  providers: [TokenMetadataWorker],
})
export class TokenMetadataWorkerModule {}
