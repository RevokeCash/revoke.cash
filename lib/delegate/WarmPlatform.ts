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
      const [hotWallet, expirationTimestamp] = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getHotWalletLink',
        args: [wallet],
      })) as [Address, bigint];

      if (!hotWallet || hotWallet === '0x0000000000000000000000000000000000000000') {
        return [];
      }

      const chainId = await this.publicClient.getChainId();

      // Return delegations where cold wallets have delegated to this wallet
      return [
        {
          type: 'ALL',
          delegator: wallet, // The cold wallet (who delegated permission)
          delegate: hotWallet, // The current wallet (hot wallet who received permission)
          contract: null,
          tokenId: null,
          direction: 'OUTGOING', // From the current wallet's perspective, these are incoming
          platform: this.name,
          chainId,
          expirationTimestamp: expirationTimestamp,
        },
      ];
    } catch (error) {
      console.error(`Error getting incoming delegations from ${this.name}:`, error);
      return [];
    }
  }

  async getIncomingDelegations(wallet: Address): Promise<Delegation[]> {
    try {
      const coldWalletLinks = (await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getColdWalletLinks',
        args: [wallet],
      })) as [Address, bigint][];

      const chainId = await this.publicClient.getChainId();

      // Return the delegation from this cold wallet to its hot wallet

      return coldWalletLinks.map(([coldWallet, expirationTimestamp]) => ({
        type: 'ALL',
        delegator: coldWallet,
        delegate: wallet, // hot wallet (current wallet)
        contract: null,
        tokenId: null,
        direction: 'INCOMING', // from hot wallet's perspective
        platform: this.name,
        chainId,
        expirationTimestamp, // convert bigint → number if needed
      }));
    } catch (error) {
      console.error(`Error getting outgoing delegations from ${this.name}:`, error);
      return [];
    }
  }

  async revokeDelegationInternal(delegation: Delegation): Promise<TransactionData> {
    if (delegation.direction !== 'OUTGOING') {
      throw new Error('Cannot revoke incoming delegations');
    }

    console.log('Revoking Warm.xyz delegation:', delegation.delegator);

    // Based on the ABI: 'function removeColdWallet(address coldWallet) external'
    return {
      address: this.address,
      abi: this.abi,
      functionName: 'removeExpiredWalletLinks',
      args: [delegation.delegate],
    };
  }
}
