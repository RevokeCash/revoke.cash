import { Module } from '@nestjs/common';
import { IndexerQueueModule } from '../queue/indexer-queue.module';
import { TOKEN_METADATA_QUEUE_NAME } from './token-metadata.queue';
import { TokenMetadataSchedulerService } from './token-metadata.scheduler.service';

@Module({
  imports: [IndexerQueueModule.register({ name: TOKEN_METADATA_QUEUE_NAME })],
  providers: [TokenMetadataSchedulerService],
})
export class TokenMetadataSchedulerModule {}
