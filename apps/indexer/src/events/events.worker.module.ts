import { Module } from '@nestjs/common';
import { ALLOWANCES_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/allowances';
import { EVENTS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/events';
import { SPENDER_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/spender-metadata';
import { TIMESTAMPS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/timestamps';
import { TOKEN_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/token-metadata';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { EventsWorker } from './events.worker';

@Module({
  imports: [
    QueueModule.register({
      name: EVENTS_QUEUE_NAME,
      limiter: { groupId: 'indexer-events', maxConcurrent: 5, overflow: 'delay' },
    }),
    QueueModule.register({ name: ALLOWANCES_QUEUE_NAME }),
    QueueModule.register({ name: TIMESTAMPS_QUEUE_NAME }),
    QueueModule.register({ name: TOKEN_METADATA_QUEUE_NAME }),
    QueueModule.register({ name: SPENDER_METADATA_QUEUE_NAME }),
  ],
  providers: [EventsWorker],
})
export class EventsWorkerModule {}
