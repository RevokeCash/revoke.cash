import { Module } from '@nestjs/common';
import { TOKEN_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/token-metadata';
import { BackendQueueModule } from '@revoke.cash/backend/queue/backend-queue.module';
import { TokenMetadataSchedulerService } from './token-metadata.scheduler.service';

@Module({
  imports: [BackendQueueModule.register({ name: TOKEN_METADATA_QUEUE_NAME })],
  providers: [TokenMetadataSchedulerService],
})
export class TokenMetadataSchedulerModule {}
