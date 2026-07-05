import { Injectable } from '@nestjs/common';
import type { ColdDelegations } from '@revoke.cash/core/auto-revoke/execution/signer';
import type { Hex } from 'viem';
import coldDelegations from './cold-delegations.json';

@Injectable()
export class ConfigService {
  get autoRevokeExecutorPrivateKey(): Hex {
    const privateKey = process.env.AUTO_REVOKE_EXECUTOR_PRIVATE_KEY as Hex | undefined;
    if (!privateKey) {
      throw new Error('AUTO_REVOKE_EXECUTOR_PRIVATE_KEY is not configured');
    }
    return privateKey;
  }

  get coldDelegations(): ColdDelegations {
    return coldDelegations as ColdDelegations;
  }

  get port(): number {
    return Number(process.env.PORT ?? 3003);
  }
}
