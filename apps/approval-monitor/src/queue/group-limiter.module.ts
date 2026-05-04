import { type DynamicModule, Module } from '@nestjs/common';
import { GROUP_LIMITER_GROUP_ID, GroupLimiterService } from './group-limiter.service';

@Module({})
export class GroupLimiterModule {
  static register(groupId: string): DynamicModule {
    return {
      module: GroupLimiterModule,
      providers: [{ provide: GROUP_LIMITER_GROUP_ID, useValue: groupId }, GroupLimiterService],
      exports: [GroupLimiterService],
    };
  }
}
