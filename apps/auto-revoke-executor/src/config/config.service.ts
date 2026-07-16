import { Injectable } from '@nestjs/common';
import type { ColdDelegationRegistry } from '@revoke.cash/core/auto-revoke/execution/signer';
import type { Hex } from 'viem';
import coldDelegations from './cold-delegations.json';

@Injectable()
export class ConfigService {
  get autoRevokeExecutorPrivateKey(): Hex {
    return this.requirePrivateKey('AUTO_REVOKE_EXECUTOR_PRIVATE_KEY');
  }

  get autoRevokeUrgentExecutorPrivateKey(): Hex {
    return this.requirePrivateKey('AUTO_REVOKE_URGENT_EXECUTOR_PRIVATE_KEY');
  }

  get coldDelegationRegistry(): ColdDelegationRegistry {
    return coldDelegations as ColdDelegationRegistry;
  }

  get port(): number {
    return Number(process.env.PORT ?? 3003);
  }

  private requirePrivateKey(envName: string): Hex {
    const privateKey = process.env[envName] as Hex | undefined;
    if (!privateKey) {
      throw new Error(`${envName} is not configured`);
    }
    return privateKey;
  }
}
