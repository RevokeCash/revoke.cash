import { Injectable } from '@nestjs/common';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';

@Injectable()
export class ConfigService {
  get isManager(): boolean {
    return process.env.IS_MANAGER === 'true';
  }

  get role(): 'manager' | 'worker' {
    return this.isManager ? 'manager' : 'worker';
  }

  get instanceId(): string {
    return process.env.RENDER_INSTANCE_ID ?? 'local';
  }

  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  get logLevel(): string {
    return process.env.LOG_LEVEL ?? 'info';
  }

  get redisUrl(): string {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is not configured');
    return url;
  }

  get port(): number {
    return Number(process.env.PORT ?? 3001);
  }

  get chains(): readonly number[] {
    return ORDERED_CHAINS;
  }

  get schedulerBatchSize(): number {
    return Number(process.env.INDEXER_SCHEDULER_BATCH_SIZE ?? 2000);
  }

  get bullBoardUser(): string {
    return process.env.BULL_BOARD_USER ?? 'admin';
  }

  get bullBoardPassword(): string {
    const password = process.env.BULL_BOARD_PASSWORD;
    if (!password) throw new Error('BULL_BOARD_PASSWORD is not configured');
    return password;
  }

  get metricsRemoteWriteUrl(): string | undefined {
    return process.env.METRICS_REMOTE_WRITE_URL;
  }
}
