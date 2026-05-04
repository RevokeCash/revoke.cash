import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { DocumentedChainId } from '@revoke.cash/core/chains';
import { deferScanOnChainBusy, recordScanFailure, scanAddressChain } from '@revoke.cash/core/monitor/scan';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';
import { MetricsService } from '../metrics/metrics.service';
import { GroupLimiterService } from '../queue/group-limiter.service';
import { SCAN_QUEUE_NAME, type ScanJobData } from './scan.queue';

@Processor(SCAN_QUEUE_NAME, { concurrency: 50, lockDuration: 90_000 })
export class ScanWorker extends WorkerHost {
  private readonly logger = new Logger(ScanWorker.name);

  constructor(
    private readonly metrics: MetricsService,
    private readonly groupLimiter: GroupLimiterService,
  ) {
    super();
  }

  async process(job: Job<ScanJobData>): Promise<void> {
    const { scanId, address, chainId, reason } = job.data;

    const result = await this.groupLimiter.runWithLimit(chainId, async () => {
      this.logger.debug({ scanId, chainId, address, reason }, 'processing scan');
      const endTimer = this.metrics.scanDuration.startTimer({ chain_id: chainId });
      const scanResult = await scanAddressChain(address, chainId as DocumentedChainId);
      if (!scanResult.nonceZeroSkipped) endTimer({ path: scanResult.path });
      return scanResult;
    });

    // If result is null the group limiter dropped this submission (per-chain cap saturated),
    // so we defer the scan and return.
    if (result === null) {
      this.metrics.scansTotal.inc({ chain_id: chainId, outcome: 'chain_busy' });
      this.logger.debug({ scanId, chainId, address }, 'group limiter full, deferring');
      await deferScanOnChainBusy(address, chainId as DocumentedChainId).catch((error) => {
        this.logger.warn({ scanId, chainId, error: parseErrorMessage(error) }, 'failed to defer chain-busy scan');
      });
      return;
    }

    if (result.nonceZeroSkipped) {
      this.metrics.scansTotal.inc({ chain_id: chainId, outcome: 'nonce_zero' });
      this.logger.debug({ scanId, chainId, address }, 'scan skipped (nonce 0)');
      return;
    }

    this.metrics.scansTotal.inc({ chain_id: chainId, outcome: 'ok' });
    this.metrics.scanLogsFetched.observe({ chain_id: chainId, path: result.path }, result.logsFetched);
    this.logger.log({ scanId, chainId, address, ...result }, 'scan completed');
  }

  // BullMQ fires `failed` after every attempt, including in-process retries. We only want to
  // bump `consecutive_failures` once BullMQ has fully given up — otherwise a single outage
  // walks the counter up by N within one retry cycle and parks the wallet on the 24h cadence.
  @OnWorkerEvent('failed')
  async onFailed(job: Job<ScanJobData> | undefined, error: Error): Promise<void> {
    const attempt = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 1;
    const exhausted = attempt >= maxAttempts;

    this.logger.error(
      {
        scanId: job?.data?.scanId,
        chainId: job?.data?.chainId,
        address: job?.data?.address,
        attempt,
        maxAttempts,
        exhausted,
        error: { message: parseErrorMessage(error), stack: error.stack },
      },
      'scan failed',
    );

    if (!exhausted || !job?.data) return;
    this.metrics.scansTotal.inc({ chain_id: job.data.chainId, outcome: 'failed' });
    await recordScanFailure(job.data.address, job.data.chainId as DocumentedChainId, error);
  }
}
