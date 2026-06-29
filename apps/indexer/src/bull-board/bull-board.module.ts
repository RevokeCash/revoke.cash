import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule as BullBoardModuleBase } from '@bull-board/nestjs';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import {
  AUTO_REVOKE_EVALUATE_QUEUE_NAME,
  AUTO_REVOKE_EXPLOIT_QUEUE_NAME,
} from '@revoke.cash/backend/auto-revoke/evaluation-queue';
import { ALLOWANCES_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/allowances';
import { EVENTS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/events';
import { SPENDER_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/spender-metadata';
import { TIMESTAMPS_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/timestamps';
import { TOKEN_METADATA_QUEUE_NAME } from '@revoke.cash/backend/indexer/queues/token-metadata';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { AllowancesSchedulerModule } from '../allowances/allowances.scheduler.module';
import { EventsSchedulerModule } from '../events/events.scheduler.module';
import { SpenderMetadataSchedulerModule } from '../spender-metadata/spender-metadata.scheduler.module';
import { TimestampsSchedulerModule } from '../timestamps/timestamps.scheduler.module';
import { TokenMetadataSchedulerModule } from '../token-metadata/token-metadata.scheduler.module';
import { BullBoardAuthMiddleware } from './bull-board.middleware';

const BULL_BOARD_ROUTE = '/queues';

@Module({
  imports: [
    EventsSchedulerModule,
    TimestampsSchedulerModule,
    AllowancesSchedulerModule,
    TokenMetadataSchedulerModule,
    SpenderMetadataSchedulerModule,
    QueueModule.register({ name: AUTO_REVOKE_EXPLOIT_QUEUE_NAME }),
    QueueModule.register({ name: AUTO_REVOKE_EVALUATE_QUEUE_NAME }),
    BullBoardModuleBase.forRoot({
      route: BULL_BOARD_ROUTE,
      adapter: ExpressAdapter,
      boardOptions: { uiConfig: { boardTitle: 'indexer' } },
    }),
    BullBoardModuleBase.forFeature(
      { name: EVENTS_QUEUE_NAME, adapter: BullMQAdapter, options: { displayName: 'Events' } },
      { name: TIMESTAMPS_QUEUE_NAME, adapter: BullMQAdapter, options: { displayName: 'Timestamps' } },
      { name: ALLOWANCES_QUEUE_NAME, adapter: BullMQAdapter, options: { displayName: 'Allowances' } },
      { name: TOKEN_METADATA_QUEUE_NAME, adapter: BullMQAdapter, options: { displayName: 'Token Metadata' } },
      { name: SPENDER_METADATA_QUEUE_NAME, adapter: BullMQAdapter, options: { displayName: 'Spender Metadata' } },
      { name: AUTO_REVOKE_EXPLOIT_QUEUE_NAME, adapter: BullMQAdapter, options: { displayName: 'Auto-Revoke Exploit' } },
      {
        name: AUTO_REVOKE_EVALUATE_QUEUE_NAME,
        adapter: BullMQAdapter,
        options: { displayName: 'Auto-Revoke Evaluate' },
      },
    ),
  ],
  providers: [BullBoardAuthMiddleware],
})
export class BullBoardModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BullBoardAuthMiddleware).forRoutes(BULL_BOARD_ROUTE);
  }
}
