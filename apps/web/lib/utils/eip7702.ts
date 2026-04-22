import { ADDRESS_ZERO } from 'lib/constants';
import type { Nullable, TransactionSubmitted } from 'lib/interfaces';
import { type Address, getAddress, type PublicClient, type WalletClient } from 'viem';
import type { SignAuthorizationParameters } from 'viem/actions';
import { isNullish, waitForTransactionConfirmation } from '.';

export const getEip7702DelegatedAddress = async (
  address: Address,
  publicClient: PublicClient,
): Promise<Nullable<Address>> => {
  const code = await publicClient.getCode({ address });

  if (isNullish(code) || code === '0x') return null;

  if (code.startsWith('0xef0100')) {
    return getAddress(code.replace('0xef0100', '0x'));
  }

  return null;
};

// Note: there's currently no way to authorize or revoke an EIP-7702 delegation programmatically.
// We keep this function in case we find a way to do so in the future.
export const revokeEip7702Delegation = async (
  address: Address,
  walletClient: WalletClient,
  publicClient: PublicClient,
): Promise<TransactionSubmitted> => {
  const authorization = await walletClient.prepareAuthorization({
    executor: 'self',
    contractAddress: ADDRESS_ZERO,
    account: address,
  });

  const signedAuthorization = await walletClient.signAuthorization(authorization as SignAuthorizationParameters);

  const hash = await walletClient.sendTransaction({
    account: address,
    to: address,
    type: 'eip7702',
    authorizationList: [signedAuthorization],
    chain: walletClient.chain,
  });

  return {
    hash,
    confirmation: waitForTransactionConfirmation(hash, publicClient),
  };
};
