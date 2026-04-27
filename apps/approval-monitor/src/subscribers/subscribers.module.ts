import { Module } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';

@Module({
  providers: [SubscribersService],
  exports: [SubscribersService],
})
export class SubscribersModule {}
