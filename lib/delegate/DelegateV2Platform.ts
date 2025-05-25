import { DELEGATE_V2_ABI } from 'lib/abis';
import { DELEGATE_V2_REGISTRY_ADDRESS } from 'lib/constants';
import type { Abi, Address } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation, DelegationV2, TransactionData } from './DelegatePlatform';

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
        const [delegationType, delegate, delegator, rights, contract, tokenId, _amount] = delegation;

        // Convert type number to string type
        const type = this.convertDelegationType(delegationType);
        console.log('The rights', rights);
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
        } as DelegationV2;
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
        const [delegationType, delegate, delegator, rights, contract, tokenId, _amount] = delegation;

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
        } as DelegationV2;
      });
    } catch (error) {
      console.error(`Error getting incoming delegations from ${this.name}:`, error);
      return [];
    }
  }

  /**
   * Implementation for revoking a specific delegation in Delegate V2
   */
  async revokeDelegationInternal(delegation: DelegationV2): Promise<TransactionData> {
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }

    console.log('The rights', delegation);
    // For DelegateV2, we need to specify different function calls based on delegation type
    switch (delegation.type) {
      case 'ALL':
        return {
          address: this.address,
          abi: this.abi,
          functionName: 'delegateAll',
          args: [delegation.delegate, delegation.rights, false],
        };
      case 'CONTRACT':
        if (!delegation.contract) throw new Error('Missing contract address for CONTRACT delegation');
        return {
          address: this.address,
          abi: this.abi,
          functionName: 'delegateContract',
          args: [delegation.delegate, delegation.contract, delegation.rights, false], // false to revoke
        };
      case 'ERC721':
        if (!delegation.contract || delegation.tokenId === null || delegation.tokenId === undefined) {
          throw new Error('Missing contract address or tokenId for TOKEN delegation');
        }
        return {
          address: this.address,
          abi: this.abi,
          functionName: 'delegateERC721',
          args: [delegation.delegate, delegation.contract, delegation.tokenId, delegation.rights, false], // false to revoke
        };
      case 'ERC20':
        if (!delegation.contract) {
          throw new Error('Missing contract address for ERC20 delegation');
        }
        console.log('The delegate', delegation.delegate);
        console.log('The delegator', delegation.delegator);
        return {
          address: this.address,
          abi: this.abi,
          functionName: 'delegateERC20',
          args: [delegation.delegate, delegation.contract, delegation.rights, false],
        };
      case 'ERC1155':
        if (!delegation.contract || delegation.tokenId === null || delegation.tokenId === undefined) {
          throw new Error('Missing contract address or tokenId for ERC1155 delegation');
        }
        return {
          address: this.address,
          abi: this.abi,
          functionName: 'delegateERC1155',
          args: [delegation.delegate, delegation.contract, delegation.tokenId, delegation.rights, false], // false to revoke
        };
      default:
        throw new Error('Unsupported delegation type for revocation');
    }
  }

  /**
   * Convert the numeric delegation type from the contract to our string type
   */
  private convertDelegationType(typeNumber: number): Delegation['type'] {
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
        return 'ERC20';
      case 5:
        return 'ERC1155';
      default:
        return 'NONE';
    }
  }
}
