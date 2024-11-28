'use client';

import type { DonateButtonType } from 'components/common/donate/DonateModal';
import { DONATION_ADDRESS } from 'lib/constants';
import { type TransactionSubmitted, TransactionType } from 'lib/interfaces';
import { getWalletAddress, waitForTransactionConfirmation } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { getChainName, getChainNativeToken, getDefaultDonationAmount } from 'lib/utils/chains';
import { parseEther } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

export const useDonate = (chainId: number, type: DonateButtonType) => {
  const nativeToken = getChainNativeToken(chainId)!;
  const defaultAmount = getDefaultDonationAmount(nativeToken)!;
  const { data: walletClient } = useWalletClient({ chainId });
  const publicClient = usePublicClient({ chainId })!;
  const handleTransaction = useHandleTransaction(chainId);

  const sendDonation = async (amount: string): Promise<TransactionSubmitted | undefined> => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    if (!amount || Number(amount) === 0) return;

    const hash = await walletClient.sendTransaction({
      account: await getWalletAddress(walletClient),
      to: DONATION_ADDRESS,
      value: parseEther(amount),
      chain: walletClient.chain,
      kzg: undefined, // TODO: Idk why I need to add this, but since Viem v2 it's required 😅
    });

    return { hash, confirmation: waitForTransactionConfirmation(hash, publicClient) };
  };

  const donate = async (amount: string): Promise<TransactionSubmitted | undefined> => {
    const transactionSubmitted = await handleTransaction(sendDonation(amount), TransactionType.DONATE);

    if (transactionSubmitted) {
      track('Donated', {
        chainId,
        chainName: getChainName(chainId),
        nativeToken,
        amount: Number(amount),
        type,
      });
    }

    return transactionSubmitted;
  };

  return { donate, nativeToken, defaultAmount };
};
