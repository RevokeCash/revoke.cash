import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule as BullBoardModuleBase } from '@bull-board/nestjs';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { getChainName, ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { scanQueueNameForChain } from '../scan/scan.queue';
import { ScanSchedulerModule } from '../scan/scan.scheduler.module';
import { timestampsQueueNameForChain } from '../timestamps/timestamps.queue';
import { TimestampsSchedulerModule } from '../timestamps/timestamps.scheduler.module';
import { BullBoardAuthMiddleware } from './bull-board.middleware';

const BULL_BOARD_ROUTE = '/queues';

const queueFeatures = ORDERED_CHAINS.flatMap((chainId) => {
  const chainName = getChainName(chainId);
  return [
    {
      name: scanQueueNameForChain(chainId),
      adapter: BullMQAdapter,
      options: { displayName: `Scan / ${chainName}` },
    },
    {
      name: timestampsQueueNameForChain(chainId),
      adapter: BullMQAdapter,
      options: { displayName: `Timestamps / ${chainName}` },
    },
  ];
});

@Module({
  imports: [
    ScanSchedulerModule,
    TimestampsSchedulerModule,
    BullBoardModuleBase.forRoot({
      route: BULL_BOARD_ROUTE,
      adapter: ExpressAdapter,
      boardOptions: { uiConfig: { boardTitle: 'approval-monitor' } },
    }),
    BullBoardModuleBase.forFeature(...queueFeatures),
  ],
  providers: [BullBoardAuthMiddleware],
})
export class BullBoardModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BullBoardAuthMiddleware).forRoutes(BULL_BOARD_ROUTE);
  }
}
