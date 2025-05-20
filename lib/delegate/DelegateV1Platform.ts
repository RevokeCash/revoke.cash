import { DELEGATE_V1_ABI } from 'lib/abis';
import { DELEGATE_V1_REGISTRY_ADDRESS } from 'lib/constants';
import type { Abi, Address } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation, TransactionData } from './DelegatePlatform';

export class DelegateV1Platform extends AbstractDelegatePlatform {
  getAddress(): Address {
    return DELEGATE_V1_REGISTRY_ADDRESS;
  }

  getAbi(): Abi {
    return DELEGATE_V1_ABI;
  }

  protected getPlatformName(): string {
    return 'Delegate V1';
  }

  async getOutgoingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const contractDelegations = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getContractLevelDelegations',
        args: [wallet],
      })) as [Address, Address][];

      const tokenDelegations = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getTokenLevelDelegations',
        args: [wallet],
      })) as [Address, bigint, Address][];

      const allDelegates = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getDelegatesForAll',
        args: [wallet],
      })) as Address[];

      const chainId = await this.publicClient.getChainId();

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
          platform: 'Delegate V1',
          chainId,
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
          platform: 'Delegate V1',
          chainId,
        });
      });

      // Process token-level delegations
      tokenDelegations.forEach(([contract, tokenId, delegate]) => {
        delegations.push({
          type: 'TOKEN',
          delegator: wallet,
          delegate,
          contract,
          tokenId,
          direction: 'OUTGOING',
          platform: this.name,
          chainId,
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
      const delegationsRaw = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getDelegationsByDelegate',
        args: [wallet],
      })) as [number, Address, Address, Address, bigint][];

      const chainId = await this.publicClient.getChainId();
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
            type = 'TOKEN';
            break;
          default:
            type = 'NONE';
        }
        delegations.push({
          type,
          delegator,
          delegate,
          contract: type === 'ALL' ? null : contract,
          tokenId: type === 'TOKEN' ? tokenId : null,
          direction: 'INCOMING',
          platform: this.name,
          chainId,
        });
      });
      return delegations;
    } catch (error) {
      console.error('Error getting incoming delegations from Delegate V1:', error);
      return [];
    }
  }

  async revokeDelegationInternal(delegation: Delegation): Promise<TransactionData> {
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
