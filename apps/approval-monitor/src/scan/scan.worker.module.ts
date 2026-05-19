import { Module } from '@nestjs/common';
import { ALLOWANCES_QUEUE_NAME } from '../allowances/allowances.queue';
import { MonitorQueueModule } from '../queue/monitor-queue.module';
import { TOKEN_ENRICHMENT_QUEUE_NAME } from '../token-enrichment/token-enrichment.queue';
import { SCAN_QUEUE_NAME } from './scan.queue';
import { ScanWorker } from './scan.worker';

@Module({
  imports: [
    MonitorQueueModule.register({
      name: SCAN_QUEUE_NAME,
      limiter: { groupId: 'monitor-scan', maxConcurrent: 3, overflow: 'delay' },
    }),
    MonitorQueueModule.register({ name: ALLOWANCES_QUEUE_NAME }),
    MonitorQueueModule.register({ name: TOKEN_ENRICHMENT_QUEUE_NAME }),
  ],
  providers: [ScanWorker],
})
export class ScanWorkerModule {}
