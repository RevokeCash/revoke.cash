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

  get port(): number {
    return Number(process.env.PORT ?? 3001);
  }

  get chains(): readonly number[] {
    return ORDERED_CHAINS;
  }

  get bullBoardUser(): string {
    return process.env.BULL_BOARD_USER ?? 'admin';
  }

  get bullBoardPassword(): string {
    const password = process.env.BULL_BOARD_PASSWORD;
    if (!password) throw new Error('BULL_BOARD_PASSWORD is not configured');
    return password;
  }

  get optionalExploitWebhookToken(): string | undefined {
    return process.env.EXPLOIT_WEBHOOK_TOKEN;
  }
}
