import { randomUUID } from 'node:crypto';
import { getQueueToken } from '@nestjs/bullmq';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Queue } from 'bullmq';
import type { Address } from 'viem';

export interface ScanJobData {
  scanId: string;
  address: Address;
  chainId: number;
  reason: 'scheduled' | 'manual';
  scheduledAt: number;
}

export type EnqueueOutcome = 'added' | 'deduped' | 'no_queue';

export const queueNameForChain = (chainId: number): string => `monitor_scan_${chainId}`;

const jobIdFor = (chainId: number, address: Address): string => `${chainId}-${address}`;

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<number, Queue<ScanJobData>>();

  constructor(private readonly moduleRef: ModuleRef) {}

  // We loop over the chains and get the queue for each chain using Nest.js's ModuleRef.
  onModuleInit(): void {
    for (const chainId of ORDERED_CHAINS) {
      const token = getQueueToken(queueNameForChain(chainId));
      const queue = this.moduleRef.get<Queue<ScanJobData>>(token, { strict: false });
      this.queues.set(chainId, queue);
    }
    this.logger.log({ chainCount: this.queues.size }, 'resolved per-chain scan queues');
  }

  async enqueueScan(
    chainId: number,
    address: Address,
    reason: ScanJobData['reason'] = 'scheduled',
  ): Promise<EnqueueOutcome> {
    const queue = this.queues.get(chainId);
    if (!queue) {
      this.logger.warn({ chainId, address }, 'no queue registered for chain; skipping enqueue');
      return 'no_queue';
    }

    const jobId = jobIdFor(chainId, address);
    const existing = await queue.getJob(jobId);
    if (existing) return 'deduped';

    const scanId = randomUUID();
    await queue.add('scan', { scanId, address, chainId, reason, scheduledAt: Date.now() }, { jobId });
    return 'added';
  }
}
