import type { Abi, Address, PublicClient } from 'viem';
import type { DelegatePlatform, Delegation } from './DelegatePlatform';

export abstract class AbstractDelegatePlatform implements DelegatePlatform {
  publicClient: PublicClient;
  protected readonly abi: Abi;
  protected readonly address: Address;

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient;
    this.abi = this.getAbi();
    this.address = this.getAddress();
  }

  protected abstract getAddress(): Address;
  protected abstract getAbi(): Abi;
  protected abstract getPlatformName(): string;

  protected get platformName(): string {
    return this.getPlatformName();
  }
  public async getDelegations(wallet: Address): Promise<Delegation[]> {
    const outgoingDelegations = await this.getOutgoingDelegations(wallet);
    const incomingDelegations = await this.getIncomingDelegations(wallet);
    return [...outgoingDelegations, ...incomingDelegations];
  }

  public async revokeDelagation(delegation: Delegation): Promise<void> {
    return this.revokeDelagationInternal(delegation);
  }

  public async revokeAllDelegations(delegations: Delegation[]): Promise<void> {
    return this.revokeAllDelegationsInternal(delegations);
  }

  protected abstract getOutgoingDelegations(wallet: Address): Promise<Delegation[]>;
  protected abstract getIncomingDelegations(wallet: Address): Promise<Delegation[]>;
  protected abstract revokeDelagationInternal(delegation: Delegation): Promise<void>;
  protected abstract revokeAllDelegationsInternal(delegations: Delegation[]): Promise<void>;
}
