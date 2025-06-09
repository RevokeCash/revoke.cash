import { ChainId } from '@revoke.cash/chains';
import { WARM_XYZ_ABI } from 'lib/abis';
import type { Address, PublicClient } from 'viem';
import { AbstractDelegatePlatform } from './AbstractDelegatePlatform';
import type { Delegation, TransactionData } from './DelegatePlatform';

export class WarmPlatform extends AbstractDelegatePlatform {
  address: Address;
  abi = WARM_XYZ_ABI;
  name = 'Warm.xyz';

  constructor(publicClient: PublicClient, chainId: number) {
    super(publicClient, chainId);

    this.address = '0xC3AA9bc72Bd623168860a1e5c6a4530d3D80456c';

    if (chainId === ChainId.EthereumSepolia) {
      this.address = '0x050e78c41339DDCa7e5a25c554c6f2C3dbB95dC4';
    }
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
          chainId: this.chainId,
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

      // Return the delegation from this cold wallet to its hot wallet

      return coldWalletLinks.map(([coldWallet, expirationTimestamp]) => ({
        type: 'ALL',
        delegator: coldWallet,
        delegate: wallet, // hot wallet (current wallet)
        contract: null,
        tokenId: null,
        direction: 'INCOMING', // from hot wallet's perspective
        platform: this.name,
        chainId: this.chainId,
        expirationTimestamp, // convert bigint → number if needed
      }));
    } catch (error) {
      console.error(`Error getting outgoing delegations from ${this.name}:`, error);
      return [];
    }
  }

  async prepareRevokeDelegationInternal(delegation: Delegation): Promise<TransactionData> {
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
