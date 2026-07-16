import { Module } from '@nestjs/common';
import { SPENDER_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/spender-metadata';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { SpenderMetadataSchedulerService } from './spender-metadata.scheduler.service';

@Module({
  imports: [QueueModule.register({ name: SPENDER_METADATA_QUEUE_NAME })],
  providers: [SpenderMetadataSchedulerService],
})
export class SpenderMetadataSchedulerModule {}
