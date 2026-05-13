import { type DynamicModule, Module } from '@nestjs/common';
import { GROUP_LIMITER_GROUP_ID, GROUP_LIMITER_MAX_CONCURRENT, GroupLimiterService } from './group-limiter.service';

interface RegisterOptions {
  groupId: string;
  // Per-chain concurrency cap. Sized for the workload: scans do heavy `eth_getLogs` over wide
  // ranges and benefit from a tight cap (3); allowance recomputes do per-token RPC checks and
  // also stay tight; enrichment is light (a handful of multicall-batched reads per token) and
  // can run much higher per chain.
  maxConcurrent: number;
}

@Module({})
export class GroupLimiterModule {
  static register(options: RegisterOptions): DynamicModule {
    return {
      module: GroupLimiterModule,
      providers: [
        { provide: GROUP_LIMITER_GROUP_ID, useValue: options.groupId },
        { provide: GROUP_LIMITER_MAX_CONCURRENT, useValue: options.maxConcurrent },
        GroupLimiterService,
      ],
      exports: [GroupLimiterService],
    };
  }
}
