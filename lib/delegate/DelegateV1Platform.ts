import { DELEGATE_V1_ABI } from 'lib/abis';
import { DELEGATE_V1_REGISTRY_ADDRESS } from 'lib/constants';
import type { Abi, Address } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation } from './DelegatePlatform';

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
          platform: this.platformName,
          chainId,
        });
      });

      return delegations;
    } catch (error) {
      console.error('Error getting delegations from Delegate V1:', error);
      return [];
    }
  }

  async getIncomingDelegations(_wallet: Address): Promise<Delegation[]> {
    // Implementation will involve reading the Delegate V1 registry
    return [];
  }

  async revokeDelagationInternal(delegation: Delegation): Promise<void> {
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }

    // Implementation will involve creating and sending a transaction
    // This will be implemented with the wallet connection pattern used elsewhere in the app
  }

  async revokeAllDelegationsInternal(delegations: Delegation[]): Promise<void> {
    // We would call revokeAllDelegates() here
    // Implementation will involve creating and sending a transaction
    // This will be implemented with the wallet connection pattern used elsewhere in the app
  }
}
