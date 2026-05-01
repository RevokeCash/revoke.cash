import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule as BullBoardModuleBase } from '@bull-board/nestjs';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { SCAN_QUEUE_NAME } from '../scan/scan.queue';
import { ScanSchedulerModule } from '../scan/scan.scheduler.module';
import { TIMESTAMPS_QUEUE_NAME } from '../timestamps/timestamps.queue';
import { TimestampsSchedulerModule } from '../timestamps/timestamps.scheduler.module';
import { BullBoardAuthMiddleware } from './bull-board.middleware';

const BULL_BOARD_ROUTE = '/queues';

@Module({
  imports: [
    ScanSchedulerModule,
    TimestampsSchedulerModule,
    BullBoardModuleBase.forRoot({
      route: BULL_BOARD_ROUTE,
      adapter: ExpressAdapter,
      boardOptions: { uiConfig: { boardTitle: 'approval-monitor' } },
    }),
    BullBoardModuleBase.forFeature(
      { name: SCAN_QUEUE_NAME, adapter: BullMQAdapter, options: { displayName: 'Scan' } },
      { name: TIMESTAMPS_QUEUE_NAME, adapter: BullMQAdapter, options: { displayName: 'Timestamps' } },
    ),
  ],
  providers: [BullBoardAuthMiddleware],
})
export class BullBoardModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BullBoardAuthMiddleware).forRoutes(BULL_BOARD_ROUTE);
  }
}
