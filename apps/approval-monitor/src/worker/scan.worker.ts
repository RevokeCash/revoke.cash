import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { type DocumentedChainId, getChainName } from '@revoke.cash/core/chains';
import { recordScanFailure, scanAddressChain } from '@revoke.cash/core/monitor/scan';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { Job } from 'bullmq';
import type { ScanJobData } from '../queue/queue.service';

export abstract class ScanWorker extends WorkerHost {
  protected readonly logger: Logger;

  constructor(public readonly chainId: DocumentedChainId) {
    super();
    this.logger = new Logger(`ScanWorker-${getChainName(chainId)}`);
  }

  async process(job: Job<ScanJobData>): Promise<void> {
    const { scanId, address, reason } = job.data;
    this.logger.debug({ scanId, chainId: this.chainId, address, reason }, 'processing scan');

    const result = await scanAddressChain(address, this.chainId);

    if (result.nonceZeroSkipped) {
      this.logger.debug({ scanId, chainId: this.chainId, address }, 'scan skipped (nonce 0)');
      return;
    }

    this.logger.log({ scanId, chainId: this.chainId, address, ...result }, 'scan completed');
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
        chainId: this.chainId,
        address: job?.data?.address,
        attempt,
        maxAttempts,
        exhausted,
        error: { message: parseErrorMessage(error), stack: error.stack },
      },
      'scan failed',
    );

    if (!exhausted || !job?.data) return;
    await recordScanFailure(job.data.address, job.data.chainId, error);
  }
}
