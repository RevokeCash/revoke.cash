import { Module } from '@nestjs/common';
import { AUTO_REVOKE_EXECUTE_QUEUE_NAME } from '@revoke.cash/backend/auto-revoke/queue';
import { QueueModule } from '@revoke.cash/backend/queue/queue.module';
import { AutoRevokeSchedulerService } from './auto-revoke.scheduler.service';

@Module({
  imports: [QueueModule.register({ name: AUTO_REVOKE_EXECUTE_QUEUE_NAME })],
  providers: [AutoRevokeSchedulerService],
})
export class AutoRevokeSchedulerModule {}
