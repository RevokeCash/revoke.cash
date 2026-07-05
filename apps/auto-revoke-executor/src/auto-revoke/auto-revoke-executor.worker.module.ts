import { Module } from '@nestjs/common';
import { AUTO_REVOKE_EXECUTE_QUEUE_NAME } from '@revoke.cash/backend/auto-revoke/queue';
import { EVENTS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/events';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { ConfigModule } from '../config/config.module';
import { AutoRevokeExecutorWorker } from './auto-revoke-executor.worker';
import { SignerService } from './signer.service';

@Module({
  imports: [
    QueueModule.register({
      name: AUTO_REVOKE_EXECUTE_QUEUE_NAME,
      limiter: { groupId: 'auto-revoke-execute', maxConcurrent: 1, overflow: 'delay' },
    }),
    QueueModule.register({ name: EVENTS_QUEUE_NAME }),
    ConfigModule,
  ],
  providers: [AutoRevokeExecutorWorker, SignerService],
})
export class AutoRevokeExecutorWorkerModule {}
