import { getQueueToken } from '@nestjs/bullmq';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Interval } from '@nestjs/schedule';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Queue } from 'bullmq';
import { timestampsQueueNameForChain } from './timestamps.queue';

@Injectable()
export class TimestampsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(TimestampsSchedulerService.name);
  private readonly queues = new Map<number, Queue>();

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit(): void {
    for (const chainId of ORDERED_CHAINS) {
      const token = getQueueToken(timestampsQueueNameForChain(chainId));
      const queue = this.moduleRef.get<Queue>(token, { strict: false });
      this.queues.set(chainId, queue);
    }
    this.logger.log({ chainCount: this.queues.size }, 'resolved per-chain timestamps queues');
  }

  @Interval(10_000)
  async tick(): Promise<void> {
    await Promise.all(
      ORDERED_CHAINS.map((chainId) =>
        this.queues.get(chainId)?.add('timestamps', {}, { jobId: `timestamps-${chainId}` }),
      ),
    );
  }
}
