import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule as BullBoardModuleBase } from '@bull-board/nestjs';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ALLOWANCES_QUEUE_NAME } from '../allowances/allowances.queue';
import { AllowancesSchedulerModule } from '../allowances/allowances.scheduler.module';
import { EVENTS_QUEUE_NAME } from '../events/events.queue';
import { EventsSchedulerModule } from '../events/events.scheduler.module';
import { TIMESTAMPS_QUEUE_NAME } from '../timestamps/timestamps.queue';
import { TimestampsSchedulerModule } from '../timestamps/timestamps.scheduler.module';
import { TOKEN_METADATA_QUEUE_NAME } from '../token-metadata/token-metadata.queue';
import { TokenMetadataSchedulerModule } from '../token-metadata/token-metadata.scheduler.module';
import { BullBoardAuthMiddleware } from './bull-board.middleware';

const BULL_BOARD_ROUTE = '/queues';

@Module({
  imports: [
    EventsSchedulerModule,
    TimestampsSchedulerModule,
    AllowancesSchedulerModule,
    TokenMetadataSchedulerModule,
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
    ),
  ],
  providers: [BullBoardAuthMiddleware],
})
export class BullBoardModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BullBoardAuthMiddleware).forRoutes(BULL_BOARD_ROUTE);
  }
}
