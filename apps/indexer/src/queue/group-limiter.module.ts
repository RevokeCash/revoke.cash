import { type DynamicModule, Module } from '@nestjs/common';
import {
  GROUP_LIMITER_GROUP_ID,
  GROUP_LIMITER_MAX_CONCURRENT,
  GROUP_LIMITER_OVERFLOW_BEHAVIOR,
  GroupLimiterService,
  type OverflowBehavior,
} from './group-limiter.service';

interface RegisterOptions {
  groupId: string;
  maxConcurrent: number;
  overflow: OverflowBehavior;
}

@Module({})
export class GroupLimiterModule {
  static register(options: RegisterOptions): DynamicModule {
    return {
      module: GroupLimiterModule,
      providers: [
        { provide: GROUP_LIMITER_GROUP_ID, useValue: options.groupId },
        { provide: GROUP_LIMITER_MAX_CONCURRENT, useValue: options.maxConcurrent },
        { provide: GROUP_LIMITER_OVERFLOW_BEHAVIOR, useValue: options.overflow },
        GroupLimiterService,
      ],
      exports: [GroupLimiterService],
    };
  }
}
