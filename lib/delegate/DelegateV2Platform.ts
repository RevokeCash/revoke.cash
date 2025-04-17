import { DELEGATE_V2_ABI } from 'lib/abis';
import { DELEGATE_V2_REGISTRY_ADDRESS } from 'lib/constants';
import type { Abi, Address } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation } from './DelegatePlatform';

type DelegateV2Result = [number, Address, Address, string, Address, bigint, bigint];

export class DelegateV2Platform extends AbstractDelegatePlatform {
  protected getAddress(): Address {
    return DELEGATE_V2_REGISTRY_ADDRESS;
  }

  protected getAbi(): Abi {
    return DELEGATE_V2_ABI;
  }

  protected getPlatformName(): string {
    return 'Delegate V2';
  }

  async getOutgoingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const delegations = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getOutgoingDelegations',
        args: [wallet],
      })) as DelegateV2Result[];

      const chainId = await this.publicClient.getChainId();

      return delegations.map((delegation) => {
        const [delegationType, delegator, delegate, rights, contract, tokenId, _amount] = delegation;

        // Convert type number to string type
        const type = this.convertDelegationType(delegationType);

        return {
          type,
          delegator,
          delegate,
          contract: type === 'ALL' ? null : contract,
          tokenId: ['TOKEN', 'ERC721', 'ERC20', 'ERC1155'].includes(type) ? tokenId : null,
          direction: 'OUTGOING',
          platform: this.platformName,
          chainId,
          rights,
        } as Delegation;
      });
    } catch (error) {
      console.error(`Error getting outgoing delegations from ${this.platformName}:`, error);
      return [];
    }
  }

  /**
   * Get incoming delegations for a wallet from Delegate V2
   */
  async getIncomingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const delegations = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getIncomingDelegations',
        args: [wallet],
      })) as DelegateV2Result[];

      const chainId = await this.publicClient.getChainId();

      return delegations.map((delegation) => {
        const [delegationType, delegator, delegate, rights, contract, tokenId, _amount] = delegation;

        // Convert type number to string type
        const type = this.convertDelegationType(delegationType);

        return {
          type,
          delegator,
          delegate,
          contract: type === 'ALL' ? null : contract,
          tokenId: ['TOKEN', 'ERC721', 'ERC20', 'ERC1155'].includes(type) ? tokenId : null,
          direction: 'INCOMING',
          platform: this.platformName,
          chainId,
          rights,
        } as Delegation;
      });
    } catch (error) {
      console.error(`Error getting incoming delegations from ${this.platformName}:`, error);
      return [];
    }
  }

  /**
   * Implementation for revoking a specific delegation in Delegate V2
   */
  async revokeDelagationInternal(delegation: Delegation): Promise<void> {
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }

    // Implementation will involve creating and sending a transaction based on the delegation type
    // This would be implemented with the wallet connection pattern used elsewhere in the app

    // For example:
    // if (delegation.type === 'ALL') {
    //   // Revoke an all-level delegation
    //   await this.sendTransaction({
    //     address: this.address,
    //     abi: this.abi,
    //     functionName: 'delegateAll',
    //     args: [delegation.delegate, delegation.rights, false]
    //   });
    // } else if (delegation.type === 'CONTRACT') {
    //   // Revoke contract-level delegation
    // } else if (delegation.type === 'ERC721') {
    //   // Revoke ERC721 token-level delegation
    // }
  }

  /**
   * Implementation for revoking all delegations in Delegate V2
   * Note: Delegate V2 doesn't have a single "revoke all" function,
   * so this would need to be implemented by revoking each delegation individually
   */
  async revokeAllDelegationsInternal(delegations: Delegation[]): Promise<void> {
    // Implementation will involve creating and sending multiple transactions
    // This will be implemented with the wallet connection pattern used elsewhere in the app
    // For example:
    // for (const delegation of delegations) {
    //   await this.revokeDelagation(delegation);
    // }
  }

  /**
   * Convert the numeric delegation type from the contract to our string type
   */
  private convertDelegationType(typeNumber: number): Delegation['type'] {
    // Based on the contract's enum values
    switch (typeNumber) {
      case 0:
        return 'NONE';
      case 1:
        return 'ALL';
      case 2:
        return 'CONTRACT';
      case 3:
        return 'TOKEN'; // In our model we map ERC721 to TOKEN
      case 4:
        return 'TOKEN'; // In our model we map ERC20 to TOKEN
      case 5:
        return 'TOKEN'; // In our model we map ERC1155 to TOKEN
      default:
        return 'NONE';
    }
  }
}
