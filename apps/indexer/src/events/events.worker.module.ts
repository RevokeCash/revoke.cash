import { Module } from '@nestjs/common';
import { ALLOWANCES_QUEUE_NAME } from '../allowances/allowances.queue';
import { IndexerQueueModule } from '../queue/indexer-queue.module';
import { TOKEN_METADATA_QUEUE_NAME } from '../token-metadata/token-metadata.queue';
import { EVENTS_QUEUE_NAME } from './events.queue';
import { EventsWorker } from './events.worker';

@Module({
  imports: [
    IndexerQueueModule.register({
      name: EVENTS_QUEUE_NAME,
      limiter: { groupId: 'indexer-events', maxConcurrent: 3, overflow: 'delay' },
    }),
    IndexerQueueModule.register({ name: ALLOWANCES_QUEUE_NAME }),
    IndexerQueueModule.register({ name: TOKEN_METADATA_QUEUE_NAME }),
  ],
  providers: [EventsWorker],
})
export class EventsWorkerModule {}
