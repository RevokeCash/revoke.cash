import { ChainId } from '@revoke.cash/chains';
import { WARM_XYZ_ABI } from 'lib/abis';
import { ADDRESS_ZERO } from 'lib/constants';
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
      const [hotWallet, expirationTimestamp] = await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getHotWalletLink',
        args: [wallet],
      });

      if (!hotWallet || hotWallet === '0x0000000000000000000000000000000000000000') {
        return [];
      }

      return [
        {
          type: 'WALLET',
          delegator: wallet,
          delegate: hotWallet,
          contract: null,
          tokenId: null,
          direction: 'OUTGOING',
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
      const coldWalletLinks = await this.publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getColdWalletLinks',
        args: [wallet],
      });

      return coldWalletLinks.map(([coldWallet, expirationTimestamp]) => ({
        type: 'WALLET',
        delegator: coldWallet,
        delegate: wallet,
        contract: null,
        tokenId: null,
        direction: 'INCOMING',
        platform: this.name,
        chainId: this.chainId,
        expirationTimestamp,
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

    return {
      address: this.address,
      abi: this.abi,
      functionName: 'setHotWallet',
      args: [ADDRESS_ZERO, 0n, false],
    };
  }
}
