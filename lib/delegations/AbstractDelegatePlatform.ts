import type { Abi, Address, PublicClient } from 'viem';
import type { DelegatePlatform, Delegation, TransactionData } from './DelegatePlatform';

export abstract class AbstractDelegatePlatform implements DelegatePlatform {
  abstract name: string;

  protected abstract abi: Abi;
  protected abstract address: Address;

  constructor(
    public publicClient: PublicClient,
    public chainId: number,
  ) {}

  public async getDelegations(wallet: Address): Promise<Delegation[]> {
    const outgoingDelegations = await this.getOutgoingDelegations(wallet);
    const incomingDelegations = await this.getIncomingDelegations(wallet);

    return [...outgoingDelegations, ...incomingDelegations];
  }

  public async prepareRevokeDelegation(delegation: Delegation): Promise<TransactionData> {
    return this.prepareRevokeDelegationInternal(delegation);
  }

  protected abstract getOutgoingDelegations(wallet: Address): Promise<Delegation[]>;
  protected abstract getIncomingDelegations(wallet: Address): Promise<Delegation[]>;
  protected abstract prepareRevokeDelegationInternal(delegation: Delegation): Promise<TransactionData>;
}
