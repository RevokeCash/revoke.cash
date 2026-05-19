import { Module } from '@nestjs/common';
import { MonitorQueueModule } from '../queue/monitor-queue.module';
import { TOKEN_ENRICHMENT_QUEUE_NAME } from './token-enrichment.queue';
import { TokenEnrichmentWorker } from './token-enrichment.worker';

@Module({
  imports: [
    MonitorQueueModule.register({
      name: TOKEN_ENRICHMENT_QUEUE_NAME,
      limiter: { groupId: 'monitor-token-enrichment', maxConcurrent: 20, overflow: 'delay' },
    }),
  ],
  providers: [TokenEnrichmentWorker],
})
export class TokenEnrichmentWorkerModule {}
