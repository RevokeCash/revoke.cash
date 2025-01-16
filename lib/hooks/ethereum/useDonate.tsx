'use client';

import type { DonateButtonType } from 'components/common/donate/DonateModal';
import { DONATION_ADDRESS } from 'lib/constants';
import { type TransactionSubmitted, TransactionType } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { type DocumentedChainId, getChainName, getChainNativeToken, getDefaultDonationAmount } from 'lib/utils/chains';
import { type SendTransactionParameters, parseEther } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

export const useDonate = (chainId: number, type: DonateButtonType) => {
  const nativeToken = getChainNativeToken(chainId)!;
  const defaultAmount = getDefaultDonationAmount(nativeToken)!;
  const { data: walletClient } = useWalletClient({ chainId });
  const publicClient = usePublicClient({ chainId })!;
  const handleTransaction = useHandleTransaction(chainId);

  const sendDonation = async (amount: string): Promise<TransactionSubmitted> => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    if (!amount || Number(amount) === 0) {
      throw new Error('User rejected donation');
    }

    const hash = await walletClient.sendTransaction(await prepareDonate(amount));

    return { hash, confirmation: waitForTransactionConfirmation(hash, publicClient) };
  };

  const prepareDonate = async (amount: string): Promise<SendTransactionParameters> => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    return {
      account: walletClient.account!,
      to: DONATION_ADDRESS,
      value: parseEther(amount),
      chain: walletClient.chain,
      kzg: undefined, // TODO: Idk why I need to add this, but since Viem v2 it's required 😅
    };
  };

  const donate = async (amount: string): Promise<TransactionSubmitted | undefined> => {
    const transactionSubmitted = await handleTransaction(sendDonation(amount), TransactionType.DONATE);
    if (transactionSubmitted) trackDonate(chainId, amount, type);
    return transactionSubmitted;
  };

  return { prepareDonate, donate, nativeToken, defaultAmount };
};

export const getTipSelection = (chainId: DocumentedChainId, amount: string) => {
  const defaultAmount = getDefaultDonationAmount(getChainNativeToken(chainId));
  if (Number(amount) === 0) return 'none';
  if (Number(amount) < Number(defaultAmount)) return 'low';
  if (Number(amount) > Number(defaultAmount)) return 'high';
  return 'mid';
};

export const trackDonate = (chainId: DocumentedChainId, amount: string, type: DonateButtonType) => {
  if (!Number(amount)) return;

  track('Donated', {
    chainId,
    chainName: getChainName(chainId),
    nativeToken: getChainNativeToken(chainId),
    amount: Number(amount),
    type,
  });
};
