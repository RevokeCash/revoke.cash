import { Injectable } from '@nestjs/common';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import type { ExecutionLane, ExecutorSigners } from '@revoke.cash/core/auto-revoke/execution/signer';
import { isAddressEqual } from 'viem';
import { ConfigService } from '../config/config.service';
import { HotWalletSigner } from './hot-wallet-signer';

// Holds one hot wallet per execution lane. Urgent (exploit) revokes run on their own wallet and
// thus their own per-chain nonce pipeline, so they are never stuck behind queued normal revokes.
@Injectable()
export class SignerService implements ExecutorSigners {
  readonly normal: HotWalletSigner;
  readonly urgent: HotWalletSigner;

  constructor(config: ConfigService) {
    this.normal = new HotWalletSigner(config.autoRevokeExecutorPrivateKey, config.coldDelegationRegistry);
    this.urgent = new HotWalletSigner(config.autoRevokeUrgentExecutorPrivateKey, config.coldDelegationRegistry);

    this.assertLaneWalletsAreDistinct();
    this.assertLaneCoversSupportedChains('normal', this.normal);
    this.assertLaneCoversSupportedChains('urgent', this.urgent);
  }

  private assertLaneWalletsAreDistinct(): void {
    if (isAddressEqual(this.normal.address, this.urgent.address)) {
      throw new Error(
        'The normal and urgent executor wallets must be distinct accounts so each lane has its own nonce pipeline',
      );
    }
  }

  // Every supported chain must have a delegation in both lanes before boot: a missing delegation
  // would otherwise only surface as that chain's revokes looping transient_error — for the urgent
  // lane during an exploit, the worst possible moment to discover a skipped ceremony.
  private assertLaneCoversSupportedChains(lane: ExecutionLane, signer: HotWalletSigner): void {
    const delegatedChainIds = new Set(signer.getDelegatedChainIds());
    const missingChainIds = AUTO_REVOKE_SUPPORTED_CHAINS.filter((chainId) => !delegatedChainIds.has(chainId));
    if (missingChainIds.length === 0) return;

    throw new Error(
      `The ${lane} hot wallet ${signer.address} is missing cold delegations for chain(s) ${missingChainIds.join(', ')} ` +
        `(run \`yarn ceremony --lane=${lane} --chains=${missingChainIds.join(',')}\`)`,
    );
  }
}
