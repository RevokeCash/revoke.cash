import { DELEGATE_V2_ABI } from 'lib/abis';
import { DELEGATE_V2_REGISTRY_ADDRESS } from 'lib/constants';
import type { Abi, Address } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation, TransactionData } from './DelegatePlatform';

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
          platform: this.name,
          chainId,
          rights,
        } as Delegation;
      });
    } catch (error) {
      console.error(`Error getting outgoing delegations from ${this.name}:`, error);
      return [];
    }
  }

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
          platform: this.name,
          chainId,
          rights,
        } as Delegation;
      });
    } catch (error) {
      console.error(`Error getting incoming delegations from ${this.name}:`, error);
      return [];
    }
  }

  /**
   * Implementation for revoking a specific delegation in Delegate V2
   */
  async revokeDelegationInternal(delegation: Delegation): Promise<TransactionData> {
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }

    // For DelegateV2, we need to specify different function calls based on delegation type
    let functionName: string;
    let args: any[];

    switch (delegation.type) {
      case 'ALL':
        functionName = 'delegateAll';
        args = [delegation.delegate, '', false]; // false to revoke
        break;
      case 'CONTRACT':
        if (!delegation.contract) throw new Error('Missing contract address for CONTRACT delegation');
        functionName = 'delegateContract';
        args = [delegation.contract, delegation.delegate, '', false]; // false to revoke
        break;
      case 'ERC721':
        if (!delegation.contract || delegation.tokenId === null || delegation.tokenId === undefined) {
          throw new Error('Missing contract address or tokenId for TOKEN delegation');
        }
        functionName = 'delegateERC721';
        args = [delegation.contract, delegation.tokenId, delegation.delegate, '', false]; // false to revoke
        break;
      case 'ERC20':
        if (!delegation.contract) {
          throw new Error('Missing contract address for ERC20 delegation');
        }
        functionName = 'delegateERC20';
        args = [delegation.contract, delegation.delegate, '', false]; // false to revoke
        break;
      case 'ERC1155':
        if (!delegation.contract || delegation.tokenId === null || delegation.tokenId === undefined) {
          throw new Error('Missing contract address or tokenId for ERC1155 delegation');
        }
        functionName = 'delegateERC1155';
        args = [delegation.contract, delegation.tokenId, delegation.delegate, '', false]; // false to revoke
        break;
      default:
        throw new Error('Unsupported delegation type for revocation');
    }

    // Return the transaction data for the UI to execute
    return {
      address: this.address,
      abi: this.abi,
      functionName,
      args,
    };
  }

  /**
   * Implementation for revoking all delegations in Delegate V2
   * Note: Delegate V2 doesn't have a single "revoke all" function,
   * so we use a general approach to revoke the highest level delegation
   */
  async revokeAllDelegationsInternal(): Promise<TransactionData> {
    // In DelegateV2, we can't revoke everything with one call
    // We'll use the delegateAll method with revoke parameter (false) for a blanket revocation
    // This is the closest to a "revoke all" we can get in one transaction

    return {
      address: this.address,
      abi: this.abi,
      functionName: 'delegateAll',
      args: ['0x0000000000000000000000000000000000000000', '', false], // Using zero address as a blanket revocation
    };
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
        return 'ERC721';
      case 4:
        return 'ERC20'; // In our model we map ERC20 to TOKEN
      case 5:
        return 'ERC1155'; // In our model we map ERC1155 to TOKEN
      default:
        return 'NONE';
    }
  }
}
