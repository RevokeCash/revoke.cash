import type { Delegation } from '@metamask/smart-accounts-kit';
import {
  type ColdDelegationRegistry,
  type ColdDelegations,
  getColdDelegationsForWallet,
  type SignedTransaction,
  type Signer,
  type UnsignedTransaction,
} from '@revoke.cash/core/auto-revoke/execution/signer';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { AUTO_REVOKE_DELEGATION_ADDRESS } from '@revoke.cash/core/constants';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { type Address, getAddress, type Hash, type Hex, keccak256 } from 'viem';
import { type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';

// One hot wallet with the signed cold delegations (one per chain) that name it as delegate,
// looked up in the registry under the wallet's own address
export class HotWalletSigner implements Signer {
  private readonly account: PrivateKeyAccount;
  private readonly coldDelegations: ColdDelegations;

  readonly address: Address;

  constructor(privateKey: Hex, registry: ColdDelegationRegistry) {
    this.account = privateKeyToAccount(privateKey);
    this.address = this.account.address;
    this.coldDelegations = getColdDelegationsForWallet(registry, this.address);

    this.assertDelegationsAreConsistent();
  }

  getDelegatedChainIds(): number[] {
    return Object.keys(this.coldDelegations).map(Number);
  }

  getColdDelegation(chainId: number): Delegation {
    const delegation = this.coldDelegations[chainId];
    if (!delegation) {
      throw new Error(`No cold delegation configured for chain ${chainId} (run the ceremony for it)`);
    }
    return delegation;
  }

  async signTransaction(transaction: UnsignedTransaction): Promise<SignedTransaction> {
    const signedTransaction = await this.account.signTransaction({ ...transaction, type: 'eip1559' });
    return {
      chainId: transaction.chainId,
      txHash: keccak256(signedTransaction),
      rawTransaction: signedTransaction,
    };
  }

  async submitSignedTransaction(transaction: SignedTransaction): Promise<Hash> {
    const publicClient = createViemPublicClientForChain(transaction.chainId);

    try {
      return await publicClient.sendRawTransaction({ serializedTransaction: transaction.rawTransaction });
    } catch (error) {
      if (isIdempotentBroadcastError(error)) return transaction.txHash;
      throw error;
    }
  }

  private assertDelegationsAreConsistent(): void {
    const coldRoot = getAddress(AUTO_REVOKE_DELEGATION_ADDRESS);
    for (const [chainId, delegation] of Object.entries(this.coldDelegations)) {
      if (getAddress(delegation.delegator) !== coldRoot) {
        throw new Error(
          `Chain ${chainId} cold delegation delegator ${delegation.delegator} does not match AUTO_REVOKE_DELEGATION_ADDRESS ${coldRoot}`,
        );
      }
      if (getAddress(delegation.delegate) !== this.address) {
        throw new Error(
          `Chain ${chainId} cold delegation delegate ${delegation.delegate} does not match the hot wallet ${this.address}`,
        );
      }
    }
  }
}

const isIdempotentBroadcastError = (error: unknown): boolean => {
  const message = parseErrorMessage(error).toLowerCase();
  return (
    message.includes('already known') ||
    message.includes('already imported') ||
    message.includes('known transaction') ||
    message.includes('transaction already exists') ||
    message.includes('nonce too low')
  );
};
