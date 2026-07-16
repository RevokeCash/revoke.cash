import type { Address, PublicClient } from 'viem';
import type { DelegatePlatform, Delegation, TransactionData } from './DelegatePlatform';
import { DelegateV1Platform } from './DelegateV1Platform';
import { DelegateV2Platform } from './DelegateV2Platform';
import { WarmPlatform } from './WarmPlatform';

export class AggregateDelegatePlatform implements DelegatePlatform {
  name = '__AGGREGATED_DELEGATION_PLATFORMS__';
  protected platforms: DelegatePlatform[];

  constructor(
    public publicClient: PublicClient,
    public chainId: number,
  ) {
    this.platforms = [
      new DelegateV1Platform(publicClient, chainId),
      new DelegateV2Platform(publicClient, chainId),
      new WarmPlatform(publicClient, chainId),
    ];
  }

  async getDelegations(wallet: Address): Promise<Delegation[]> {
    const delegations = await Promise.all(this.platforms.map((platform) => platform.getDelegations(wallet)));
    return delegations.flat();
  }

  async prepareRevokeDelegation(delegation: Delegation): Promise<TransactionData> {
    const platform = this.platforms.find((platform) => platform.name === delegation.platform);
    if (!platform) throw new Error(`Platform ${delegation.platform} not found`);

    return platform.prepareRevokeDelegation(delegation);
  }
}
