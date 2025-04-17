import { WARM_XYZ_ABI } from 'lib/abis';
import { WARM_ETH_ADDRESS } from 'lib/constants';
import type { Abi, Address } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation } from './DelegatePlatform';

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
          platform: this.platformName,
          chainId,
          expirationTimestamp,
        };
      });
    } catch (error) {
      console.error(`Error getting outgoing delegations from ${this.platformName}:`, error);
      return [];
    }
  }

  /**
   * Get incoming delegations for a wallet from Warm.xyz
   * For Warm, "incoming" delegations are from a cold wallet's perspective,
   * showing the hot wallet it has delegated to.
   */
  async getIncomingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const hotWallet = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getHotWallet',
        args: [wallet],
      })) as Address;

      // If the hot wallet is the zero address, there's no delegation
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

      // Return the hot wallet as a delegation
      return [
        {
          type: 'ALL', // Warm delegations are always full delegations
          delegator: wallet, // The cold wallet is the delegator
          delegate: hotWalletLink[0], // The hot wallet is the delegate
          contract: null,
          tokenId: null,
          direction: 'OUTGOING', // From the cold wallet's perspective, this is an outgoing delegation
          platform: this.platformName,
          chainId,
          expirationTimestamp: hotWalletLink[1], // Additional property for Warm delegations
        },
      ];
    } catch (error) {
      console.error(`Error getting incoming delegations from ${this.platformName}:`, error);
      return [];
    }
  }

  /**
   * Implementation for revoking a specific delegation in Warm.xyz
   */
  async revokeDelagationInternal(delegation: Delegation): Promise<void> {
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }

    // Implementation will involve creating and sending a transaction to removeColdWallet
    // This will be implemented with the wallet connection pattern used elsewhere in the app

    // For example:
    // await this.sendTransaction({
    //   address: this.address,
    //   abi: this.abi,
    //   functionName: 'removeColdWallet',
    //   args: [delegation.delegator]
    // });
  }

  /**
   * Implementation for revoking all delegations in Warm.xyz
   * Note: For Warm.xyz, a cold wallet can only delegate to one hot wallet,
   * so this would be the same as revoking a single delegation.
   */
  async revokeAllDelegationsInternal(delegations: Delegation[]): Promise<void> {
    // For Warm.xyz, you'd need to revoke each delegation separately
    // This will be implemented with the wallet connection pattern used elsewhere in the app
    // For example:
    // for (const delegation of delegations) {
    //   await this.revokeDelagation(delegation);
    // }
  }
}
