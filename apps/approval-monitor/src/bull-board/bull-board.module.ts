import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule as BullBoardModuleBase } from '@bull-board/nestjs';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { QueueModule } from '../queue/queue.module';
import { queueNameForChain } from '../queue/queue.service';
import { BullBoardAuthMiddleware } from './bull-board.middleware';

const BULL_BOARD_ROUTE = '/queues';

@Module({
  imports: [
    QueueModule,
    BullBoardModuleBase.forRoot({
      route: BULL_BOARD_ROUTE,
      adapter: ExpressAdapter,
      boardOptions: { uiConfig: { boardTitle: 'approval-monitor' } },
    }),
    ...ORDERED_CHAINS.map((chainId) =>
      BullBoardModuleBase.forFeature({
        name: queueNameForChain(chainId),
        adapter: BullMQAdapter,
      }),
    ),
  ],
  providers: [BullBoardAuthMiddleware],
})
export class BullBoardModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BullBoardAuthMiddleware).forRoutes(BULL_BOARD_ROUTE);
  }
}
