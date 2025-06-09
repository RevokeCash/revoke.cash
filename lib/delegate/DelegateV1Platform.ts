import { DELEGATE_V1_ABI } from 'lib/abis';
import type { Address } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation, TransactionData } from './DelegatePlatform';

export class DelegateV1Platform extends AbstractDelegatePlatform {
  address = '0x00000000000076A84feF008CDAbe6409d2FE638B' as const;
  abi = DELEGATE_V1_ABI;
  name = 'Delegate.xyz V1';

  async getOutgoingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const contractDelegations = await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getContractLevelDelegations',
        args: [wallet],
      });

      const tokenDelegations = await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getTokenLevelDelegations',
        args: [wallet],
      });

      const allDelegates = await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getDelegatesForAll',
        args: [wallet],
      });

      const delegations: Delegation[] = [];

      // Process all-level delegations
      allDelegates.forEach((delegate) => {
        delegations.push({
          type: 'ALL',
          delegator: wallet,
          delegate,
          contract: null,
          tokenId: null,
          direction: 'OUTGOING',
          platform: this.name,
          chainId: this.chainId,
        });
      });

      // Process contract-level delegations
      contractDelegations.forEach(([contract, delegate]) => {
        delegations.push({
          type: 'CONTRACT',
          delegator: wallet,
          delegate,
          contract,
          tokenId: null,
          direction: 'OUTGOING',
          platform: this.name,
          chainId: this.chainId,
        });
      });

      // Process token-level delegations
      tokenDelegations.forEach(([contract, tokenId, delegate]) => {
        delegations.push({
          type: 'ERC721',
          delegator: wallet,
          delegate,
          contract,
          tokenId,
          direction: 'OUTGOING',
          platform: this.name,
          chainId: this.chainId,
        });
      });

      return delegations;
    } catch (error) {
      console.error('Error getting delegations from Delegate V1:', error);
      return [];
    }
  }

  async getIncomingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const delegationsRaw = await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getDelegationsByDelegate',
        args: [wallet],
      });

      const delegations: Delegation[] = [];

      delegationsRaw.forEach(([delegationType, delegator, delegate, contract, tokenId]) => {
        let type: Delegation['type'];
        switch (delegationType) {
          case 1:
            type = 'ALL';
            break;
          case 2:
            type = 'CONTRACT';
            break;
          case 3:
            type = 'ERC721';
            break;
          default:
            type = 'NONE';
        }
        delegations.push({
          type,
          delegator,
          delegate,
          contract: type === 'ALL' ? null : contract,
          tokenId: type === 'ERC721' ? tokenId : null,
          direction: 'INCOMING',
          platform: this.name,
          chainId: this.chainId,
        });
      });
      return delegations;
    } catch (error) {
      console.error('Error getting incoming delegations from Delegate V1:', error);
      return [];
    }
  }

  async prepareRevokeDelegationInternal(delegation: Delegation): Promise<TransactionData> {
    console.log('delegate for V1', delegation.delegate);
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }

    if (delegation.type === 'ALL') {
      return {
        address: this.address,
        abi: this.abi,
        functionName: 'revokeAllDelegates',
        args: [],
      };
    }

    return {
      address: this.address,
      abi: this.abi,
      functionName: 'revokeDelegate',
      args: [delegation.delegate],
    };
  }
}
