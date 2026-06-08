import { Module } from '@nestjs/common';
import { ALLOWANCES_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/allowances';
import { EVENTS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/events';
import { SPENDER_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/spender-metadata';
import { TIMESTAMPS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/timestamps';
import { TOKEN_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/token-metadata';
import { BackendQueueModule } from '@revoke.cash/backend/queue/backend-queue.module';
import { EventsWorker } from './events.worker';

@Module({
  imports: [
    BackendQueueModule.register({
      name: EVENTS_QUEUE_NAME,
      limiter: { groupId: 'indexer-events', maxConcurrent: 5, overflow: 'delay' },
    }),
    BackendQueueModule.register({ name: ALLOWANCES_QUEUE_NAME }),
    BackendQueueModule.register({ name: TIMESTAMPS_QUEUE_NAME }),
    BackendQueueModule.register({ name: TOKEN_METADATA_QUEUE_NAME }),
    BackendQueueModule.register({ name: SPENDER_METADATA_QUEUE_NAME }),
  ],
  providers: [EventsWorker],
})
export class EventsWorkerModule {}
