import { Module } from '@nestjs/common';
import { MonitorQueueModule } from '../queue/monitor-queue.module';
import { TOKEN_ENRICHMENT_QUEUE_NAME } from './token-enrichment.queue';
import { TokenEnrichmentSchedulerService } from './token-enrichment.scheduler.service';

@Module({
  imports: [MonitorQueueModule.register({ name: TOKEN_ENRICHMENT_QUEUE_NAME })],
  providers: [TokenEnrichmentSchedulerService],
})
export class TokenEnrichmentSchedulerModule {}
