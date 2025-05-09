import { WARM_XYZ_ABI } from 'lib/abis';
import { WARM_ETH_ADDRESS } from 'lib/constants';
import type { Abi, Address } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation, TransactionData } from './DelegatePlatform';

export class WarmPlatform extends AbstractDelegatePlatform {
  protected getAddress(): Address {
    return WARM_ETH_ADDRESS;
  }

  protected getAbi(): Abi {
    return WARM_XYZ_ABI;
  }

  protected getPlatformName(): string {
    return 'Warm.xyz';
  }

  async getOutgoingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      // Get cold wallets linked to this hot wallet
      const coldWallets = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getColdWallets',
        args: [wallet],
      })) as Address[];

      const coldWalletLinks = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getColdWalletLinks',
        args: [wallet],
      })) as [Address, bigint][];

      const chainId = await this.publicClient.getChainId();

      // Map cold wallets to delegations
      return coldWalletLinks.map(([coldWallet, expirationTimestamp]) => {
        return {
          type: 'ALL',
          delegator: coldWallet,
          delegate: wallet,
          contract: null,
          tokenId: null,
          direction: 'INCOMING',
          platform: this.name,
          chainId,
          expirationTimestamp,
        };
      });
    } catch (error) {
      console.error(`Error getting outgoing delegations from ${this.name}:`, error);
      return [];
    }
  }

  async getIncomingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const hotWallet = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getHotWallet',
        args: [wallet],
      })) as Address;

      if (!hotWallet || hotWallet === '0x0000000000000000000000000000000000000000') {
        return [];
      }

      const hotWalletLink = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getHotWalletLink',
        args: [wallet],
      })) as [Address, bigint];

      const chainId = await this.publicClient.getChainId();

      return [
        {
          type: 'ALL',
          delegator: wallet,
          delegate: hotWalletLink[0],
          contract: null,
          tokenId: null,
          direction: 'OUTGOING',
          platform: this.name,
          chainId,
          expirationTimestamp: hotWalletLink[1],
        },
      ];
    } catch (error) {
      console.error(`Error getting incoming delegations from ${this.name}:`, error);
      return [];
    }
  }

  async revokeDelegationInternal(delegation: Delegation): Promise<TransactionData> {
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }
    return {
      address: this.address,
      abi: this.abi,
      functionName: 'removeColdWallet',
      args: [delegation.delegator],
    };
  }

  async revokeAllDelegationsInternal(): Promise<TransactionData> {
    return {
      address: this.address,
      abi: this.abi,
      functionName: 'removeHotWallet',
      args: [],
    };
  }
}
