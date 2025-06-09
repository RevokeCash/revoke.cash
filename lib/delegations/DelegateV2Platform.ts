import { ChainId } from '@revoke.cash/chains';
import { DELEGATE_V2_ABI } from 'lib/abis';
import type { Address, PublicClient } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation, DelegationV2, TransactionData } from './DelegatePlatform';

export class DelegateV2Platform extends AbstractDelegatePlatform {
  address: Address;
  abi = DELEGATE_V2_ABI;
  name = 'Delegate.xyz V2';

  constructor(publicClient: PublicClient, chainId: number) {
    super(publicClient, chainId);
    this.address = '0x00000000000000447e69651d841bD8D104Bed493';

    const ZKSYNC_CHAINS = [
      ChainId.Abstract,
      ChainId.AbstractSepoliaTestnet,
      ChainId.ZkSyncMainnet,
      ChainId.ZkSyncSepoliaTestnet,
      ChainId.Treasure,
    ];

    // Chains based on zkSync have a different address (see https://github.com/delegatexyz/delegate-registry)
    if (ZKSYNC_CHAINS.includes(chainId)) {
      this.address = '0x0000000059A24EB229eED07Ac44229DB56C5d797';
    }
  }

  async getOutgoingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const delegations = await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getOutgoingDelegations',
        args: [wallet],
      });

      return delegations.map((delegation) => {
        const [delegationType, delegate, delegator, rights, contract, tokenId, _amount] = delegation;

        const type = this.convertDelegationType(delegationType);

        return {
          type,
          delegator,
          delegate,
          contract: type === 'WALLET' ? null : contract,
          tokenId: ['ERC721', 'ERC20', 'ERC1155'].includes(type) ? tokenId : null,
          direction: 'OUTGOING',
          platform: this.name,
          chainId: this.chainId,
          rights,
        };
      });
    } catch (error) {
      console.error(`Error getting outgoing delegations from ${this.name}:`, error);
      return [];
    }
  }

  async getIncomingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const delegations = await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getIncomingDelegations',
        args: [wallet],
      });

      return delegations.map((delegation) => {
        const [delegationType, delegate, delegator, rights, contract, tokenId, _amount] = delegation;

        const type = this.convertDelegationType(delegationType);

        return {
          type,
          delegator,
          delegate,
          contract: type === 'WALLET' ? null : contract,
          tokenId: ['ERC721', 'ERC20', 'ERC1155'].includes(type) ? tokenId : null,
          direction: 'INCOMING',
          platform: this.name,
          chainId: this.chainId,
          rights,
        };
      });
    } catch (error) {
      console.error(`Error getting incoming delegations from ${this.name}:`, error);
      return [];
    }
  }

  async prepareRevokeDelegationInternal(delegation: DelegationV2): Promise<TransactionData> {
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }

    switch (delegation.type) {
      case 'WALLET':
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
          args: [delegation.delegate, delegation.contract, delegation.rights, false],
        };
      case 'ERC721':
        if (!delegation.contract || delegation.tokenId === null || delegation.tokenId === undefined) {
          throw new Error('Missing contract address or tokenId for TOKEN delegation');
        }
        return {
          address: this.address,
          abi: this.abi,
          functionName: 'delegateERC721',
          args: [delegation.delegate, delegation.contract, delegation.tokenId, delegation.rights, false],
        };
      case 'ERC20':
        if (!delegation.contract) {
          throw new Error('Missing contract address for ERC20 delegation');
        }
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
          args: [delegation.delegate, delegation.contract, delegation.tokenId, delegation.rights, false],
        };
      default:
        throw new Error('Unsupported delegation type for revocation');
    }
  }

  private convertDelegationType(typeNumber: number): Delegation['type'] {
    const mapping: Record<number, Delegation['type']> = {
      0: 'NONE',
      1: 'WALLET',
      2: 'CONTRACT',
      3: 'ERC721',
      4: 'ERC20',
      5: 'ERC1155',
    };

    return mapping[typeNumber] ?? 'NONE';
  }
}
