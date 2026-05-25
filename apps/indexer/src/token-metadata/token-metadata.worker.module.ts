import { Module } from '@nestjs/common';
import { IndexerQueueModule } from '../queue/indexer-queue.module';
import { TOKEN_METADATA_QUEUE_NAME } from './token-metadata.queue';
import { TokenMetadataWorker } from './token-metadata.worker';

@Module({
  imports: [
    IndexerQueueModule.register({
      name: TOKEN_METADATA_QUEUE_NAME,
      limiter: { groupId: 'indexer-token-metadata', maxConcurrent: 20, overflow: 'delay' },
    }),
  ],
  providers: [TokenMetadataWorker],
})
export class TokenMetadataWorkerModule {}
